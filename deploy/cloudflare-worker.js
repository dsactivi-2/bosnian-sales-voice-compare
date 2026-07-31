/**
 * voice-compare.activi.io
 * Tool version: 7.2.0 (phases A+B+C)
 * - Static files from GitHub (pinned COMMIT)
 * - D1: ratings, users, archive, audit
 */
const COMMIT = "df4c026"; // pin updated after each release commit
const APP_VERSION = "7.2.0";
const ADMIN_KEY = "vc-admin-2026";
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,PUT,POST,DELETE,OPTIONS",
  "access-control-allow-headers": "content-type,x-admin-key,x-user-token,x-reviewer",
};

// Seed main reviewers (stable tokens — rotate only with redeploy + DB update)
const MAIN_SEED = [
  { id: "main-arman", name: "Arman", token: "vc-main-arman-7x9k2m4p" },
  { id: "main-denis", name: "Denis", token: "vc-main-denis-3n8q5w1r" },
  { id: "main-osoba3", name: "Osoba 3", token: "vc-main-osoba3-6t2h9j4v" },
];

function json(d, s = 200) {
  return new Response(JSON.stringify(d), {
    status: s,
    headers: { "content-type": "application/json;charset=utf-8", ...CORS, "cache-control": "no-store" },
  });
}
function clamp(n) {
  n = Number(n);
  return Number.isFinite(n) ? Math.max(0, Math.min(5, Math.round(n))) : 0;
}
function toMap(rows) {
  const m = {};
  for (const r of rows) {
    m[r.voice_id + "|" + r.reviewer] = {
      pron: r.pron, prof: r.prof, warm: r.warm, clar: r.clar, emo: r.emo,
      comment: r.comment || "", ts: r.updated_at,
    };
  }
  return m;
}
function uid(prefix) {
  return prefix + "-" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}
function token() {
  const a = new Uint8Array(18);
  crypto.getRandomValues(a);
  return "vc-" + Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function schema(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS ratings (
      voice_id TEXT NOT NULL, reviewer TEXT NOT NULL,
      pron INTEGER NOT NULL DEFAULT 0, prof INTEGER NOT NULL DEFAULT 0,
      warm INTEGER NOT NULL DEFAULT 0, clar INTEGER NOT NULL DEFAULT 0,
      emo INTEGER NOT NULL DEFAULT 0, comment TEXT NOT NULL DEFAULT '',
      updated_at INTEGER NOT NULL, PRIMARY KEY(voice_id, reviewer))`),
    db.prepare(`CREATE TABLE IF NOT EXISTS voice_profiles (
      voice_id TEXT PRIMARY KEY, opening_tags TEXT NOT NULL DEFAULT '',
      objection_tags TEXT NOT NULL DEFAULT '', close_tags TEXT NOT NULL DEFAULT '',
      pace_note TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
      updated_at INTEGER NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'tester',
      token TEXT NOT NULL UNIQUE, active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL, created_by TEXT NOT NULL DEFAULT '')`),
    db.prepare(`CREATE TABLE IF NOT EXISTS archive_votes (
      voice_id TEXT NOT NULL, voter TEXT NOT NULL, created_at INTEGER NOT NULL,
      PRIMARY KEY(voice_id, voter))`),
    db.prepare(`CREATE TABLE IF NOT EXISTS archived_voices (
      voice_id TEXT PRIMARY KEY, archived_at INTEGER NOT NULL,
      voters_json TEXT NOT NULL DEFAULT '[]')`),
    db.prepare(`CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT NOT NULL, action TEXT NOT NULL,
      voice_id TEXT NOT NULL DEFAULT '', detail TEXT NOT NULL DEFAULT '', ts INTEGER NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL)`),
  ]);
  // seed main users (idempotent)
  const ts = Date.now();
  for (const u of MAIN_SEED) {
    await db.prepare(
      `INSERT INTO users (id,name,role,token,active,created_at,created_by) VALUES (?,?,?,?,1,?,'seed')
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, role='main', token=excluded.token, active=1`
    ).bind(u.id, u.name, "main", u.token, ts).run();
  }
  await db.prepare(
    `INSERT INTO app_meta (key,value,updated_at) VALUES ('app_version',?,?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`
  ).bind(APP_VERSION, ts).run();
}

async function audit(db, actor, action, voice_id, detail) {
  await db.prepare(
    `INSERT INTO audit_log (actor,action,voice_id,detail,ts) VALUES (?,?,?,?,?)`
  ).bind(String(actor||"").slice(0,64), String(action||"").slice(0,64), String(voice_id||"").slice(0,128), String(detail||"").slice(0,2000), Date.now()).run();
}

async function resolveUser(req, db) {
  const u = new URL(req.url);
  const headerTok = req.headers.get("x-user-token") || "";
  const qTok = u.searchParams.get("u") || u.searchParams.get("token") || "";
  const tok = (headerTok || qTok || "").trim();
  const me = (req.headers.get("x-reviewer") || u.searchParams.get("me") || u.searchParams.get("reviewer") || "").trim();

  if (tok) {
    const row = await db.prepare(`SELECT * FROM users WHERE token=? AND active=1`).bind(tok).first();
    if (row) return { id: row.id, name: row.name, role: row.role, token: row.token, via: "token" };
  }
  if (me) {
    const row = await db.prepare(`SELECT * FROM users WHERE name=? AND active=1`).bind(me).first();
    if (row) return { id: row.id, name: row.name, role: row.role, token: row.token, via: "me" };
  }
  return null;
}

async function listActiveUsers(db) {
  const { results } = await db.prepare(`SELECT id,name,role,token,active,created_at,created_by FROM users WHERE active=1 ORDER BY role DESC, name ASC`).all();
  return results || [];
}

async function archivedSet(db) {
  const { results } = await db.prepare(`SELECT voice_id FROM archived_voices`).all();
  return new Set((results || []).map((r) => r.voice_id));
}

async function votesFor(db, voice_id) {
  const { results } = await db.prepare(`SELECT voter, created_at FROM archive_votes WHERE voice_id=?`).all();
  return results || [];
}

const UPSERT = `INSERT INTO ratings (voice_id,reviewer,pron,prof,warm,clar,emo,comment,updated_at)
  VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(voice_id,reviewer) DO UPDATE SET
  pron=excluded.pron,prof=excluded.prof,warm=excluded.warm,clar=excluded.clar,emo=excluded.emo,
  comment=excluded.comment,updated_at=excluded.updated_at`;

async function api(req, env, path) {
  const db = env.DB;
  if (!db) return json({ error: "DB binding missing" }, 500);
  await schema(db);
  const user = await resolveUser(req, db);
  const method = req.method;

  if (path === "/api/health") {
    const c = await db.prepare("SELECT COUNT(*) AS n FROM ratings").first();
    const uc = await db.prepare("SELECT COUNT(*) AS n FROM users WHERE active=1").first();
    const ac = await db.prepare("SELECT COUNT(*) AS n FROM archived_voices").first();
    return json({
      ok: true,
      storage: "d1",
      ratings: c?.n ?? 0,
      users: uc?.n ?? 0,
      archived: ac?.n ?? 0,
      commit: COMMIT,
      appVersion: APP_VERSION,
      features: [
        "blind-ui", "personal-links", "admin-wipe-key", "reviewer-allowlist",
        "pagination-10", "test-users", "token-auth", "roles",
        "archive-2of3", "audit-log", "version-rollback",
      ],
    });
  }

  // --- me ---
  if (path === "/api/me" && method === "GET") {
    if (!user) return json({ ok: false, user: null });
    return json({
      ok: true,
      user: { id: user.id, name: user.name, role: user.role, token: user.token, via: user.via },
    });
  }

  // --- users ---
  if (path === "/api/users" && method === "GET") {
    if (!user) return json({ error: "auth required" }, 401);
    const all = await listActiveUsers(db);
    if (user.role === "main") {
      return json({
        v: 1,
        users: all.map((u) => ({
          id: u.id, name: u.name, role: u.role, token: u.token,
          active: u.active, created_at: u.created_at, created_by: u.created_by,
          linkPath: u.role === "main" ? `?me=${encodeURIComponent(u.name)}` : `?u=${encodeURIComponent(u.token)}`,
        })),
      });
    }
    // tester: only self
    return json({
      v: 1,
      users: all.filter((u) => u.id === user.id).map((u) => ({
        id: u.id, name: u.name, role: u.role, token: u.token,
        active: u.active, created_at: u.created_at,
        linkPath: `?u=${encodeURIComponent(u.token)}`,
      })),
    });
  }

  if (path === "/api/users" && method === "POST") {
    if (!user || user.role !== "main") return json({ error: "main role required" }, 403);
    const b = await req.json().catch(() => null);
    const name = String(b?.name || "").trim().slice(0, 64);
    if (!name) return json({ error: "name required" }, 400);
    if (MAIN_SEED.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      return json({ error: "name reserved for main user" }, 400);
    }
    const exists = await db.prepare(`SELECT id FROM users WHERE lower(name)=lower(?) AND active=1`).bind(name).first();
    if (exists) return json({ error: "name already exists" }, 409);
    const id = uid("tester");
    const tok = token();
    const ts = Date.now();
    await db.prepare(
      `INSERT INTO users (id,name,role,token,active,created_at,created_by) VALUES (?,?,?,?,1,?,?)`
    ).bind(id, name, "tester", tok, ts, user.name).run();
    await audit(db, user.name, "user.create", "", name);
    return json({
      ok: true,
      user: { id, name, role: "tester", token: tok, linkPath: `?u=${encodeURIComponent(tok)}` },
    });
  }

  if (path === "/api/users" && method === "DELETE") {
    if (!user || user.role !== "main") return json({ error: "main role required" }, 403);
    const u = new URL(req.url);
    const id = u.searchParams.get("id") || "";
    if (!id) return json({ error: "id required" }, 400);
    const row = await db.prepare(`SELECT * FROM users WHERE id=?`).bind(id).first();
    if (!row) return json({ error: "not found" }, 404);
    if (row.role === "main") return json({ error: "cannot delete main user" }, 403);
    await db.prepare(`UPDATE users SET active=0 WHERE id=?`).bind(id).run();
    await audit(db, user.name, "user.deactivate", "", row.name);
    return json({ ok: true, deactivated: id });
  }

  // --- ratings ---
  if (path === "/api/ratings" && method === "GET") {
    const arch = await archivedSet(db);
    const { results } = await db.prepare("SELECT * FROM ratings ORDER BY updated_at DESC").all();
    let rows = results || [];
    // hide archived ratings from testers
    if (user?.role === "tester") {
      rows = rows.filter((r) => r.reviewer === user.name && !arch.has(r.voice_id));
    } else if (!user) {
      // public read of non-archived only (legacy); prefer auth
      rows = rows.filter((r) => !arch.has(r.voice_id));
    } else {
      // main sees all including archived (for archive UI)
    }
    return json({
      v: 1,
      storage: "d1",
      ratings: toMap(rows),
      count: rows.length,
      archivedIds: user?.role === "main" ? [...arch] : [],
    });
  }

  if (path === "/api/ratings" && method === "PUT") {
    const b = await req.json().catch(() => null);
    if (!b?.voice_id || !b?.reviewer) return json({ error: "voice_id and reviewer required" }, 400);
    const reviewer = String(b.reviewer).slice(0, 64);
    // auth: must be known active user; token locks identity
    const allowed = await db.prepare(`SELECT name, role FROM users WHERE name=? AND active=1`).bind(reviewer).first();
    if (!allowed) return json({ error: "reviewer not allowed" }, 403);
    if (user) {
      if (user.name !== reviewer) return json({ error: "cannot rate as another user" }, 403);
    } else {
      // legacy: allow if name is active user (compat) — prefer token in new UI
    }
    const arch = await archivedSet(db);
    const voice_id = String(b.voice_id).slice(0, 128);
    if (arch.has(voice_id) && allowed.role !== "main") {
      return json({ error: "voice archived" }, 403);
    }
    const ts = Number(b.ts) || Date.now();
    await db.prepare(UPSERT).bind(
      voice_id, reviewer,
      clamp(b.pron), clamp(b.prof), clamp(b.warm), clamp(b.clar), clamp(b.emo),
      String(b.comment || "").slice(0, 1000), ts
    ).run();
    return json({ ok: true, key: voice_id + "|" + reviewer });
  }

  if (path === "/api/ratings/bulk" && method === "PUT") {
    const b = await req.json().catch(() => null);
    const ratings = b?.ratings || b;
    if (!ratings || typeof ratings !== "object") return json({ error: "ratings object required" }, 400);
    const arch = await archivedSet(db);
    const stmts = [];
    let n = 0, skipped = 0;
    for (const [key, val] of Object.entries(ratings)) {
      if (!val || typeof val !== "object") continue;
      const p = key.split("|");
      if (p.length < 2) continue;
      const voice_id = p[0].slice(0, 128);
      const reviewer = p.slice(1).join("|").slice(0, 64);
      if (user && user.name !== reviewer) { skipped++; continue; }
      const allowed = await db.prepare(`SELECT name FROM users WHERE name=? AND active=1`).bind(reviewer).first();
      if (!allowed) { skipped++; continue; }
      if (arch.has(voice_id) && user?.role !== "main") { skipped++; continue; }
      const ts = Number(val.ts) || Date.now();
      stmts.push(db.prepare(UPSERT).bind(
        voice_id, reviewer,
        clamp(val.pron), clamp(val.prof), clamp(val.warm), clamp(val.clar), clamp(val.emo),
        String(val.comment || "").slice(0, 1000), ts
      ));
      n++;
    }
    if (stmts.length) await db.batch(stmts);
    return json({ ok: true, upserted: n, skipped });
  }

  if (path === "/api/ratings" && method === "DELETE") {
    const u = new URL(req.url);
    const voice_id = u.searchParams.get("voice_id");
    const reviewer = u.searchParams.get("reviewer");
    if (voice_id && reviewer) {
      if (user && user.name !== reviewer && user.role !== "main") {
        return json({ error: "forbidden" }, 403);
      }
      const allowed = await db.prepare(`SELECT name FROM users WHERE name=? AND active=1`).bind(reviewer).first();
      if (!allowed && !(user?.role === "main")) return json({ error: "reviewer not allowed" }, 403);
      await db.prepare("DELETE FROM ratings WHERE voice_id=? AND reviewer=?").bind(voice_id, reviewer).run();
      await audit(db, user?.name || reviewer, "rating.delete", voice_id, reviewer);
      return json({ ok: true, deleted: 1 });
    }
    if (u.searchParams.get("all") === "1") {
      const key = req.headers.get("x-admin-key") || "";
      if (key !== ADMIN_KEY) return json({ error: "admin key required for full wipe" }, 401);
      await db.prepare("DELETE FROM ratings").run();
      await audit(db, "admin", "ratings.wipe_all", "", "");
      return json({ ok: true, deleted: "all" });
    }
    return json({ error: "provide voice_id+reviewer or all=1" }, 400);
  }

  // --- profiles ---
  if (path === "/api/profiles" && method === "GET") {
    const { results } = await db.prepare("SELECT * FROM voice_profiles").all();
    const m = {};
    for (const r of results || []) {
      m[r.voice_id] = {
        opening_tags: r.opening_tags, objection_tags: r.objection_tags,
        close_tags: r.close_tags, pace_note: r.pace_note, notes: r.notes, ts: r.updated_at,
      };
    }
    return json({ v: 1, profiles: m });
  }
  if (path === "/api/profiles" && method === "PUT") {
    if (!user || user.role !== "main") return json({ error: "main role required" }, 403);
    const b = await req.json().catch(() => null);
    if (!b?.voice_id) return json({ error: "voice_id required" }, 400);
    const id = String(b.voice_id).slice(0, 128);
    const ts = Date.now();
    await db.prepare(
      `INSERT INTO voice_profiles (voice_id,opening_tags,objection_tags,close_tags,pace_note,notes,updated_at)
       VALUES (?,?,?,?,?,?,?) ON CONFLICT(voice_id) DO UPDATE SET
       opening_tags=excluded.opening_tags,objection_tags=excluded.objection_tags,
       close_tags=excluded.close_tags,pace_note=excluded.pace_note,notes=excluded.notes,updated_at=excluded.updated_at`
    ).bind(
      id,
      String(b.opening_tags || "").slice(0, 200),
      String(b.objection_tags || "").slice(0, 200),
      String(b.close_tags || "").slice(0, 200),
      String(b.pace_note || "").slice(0, 500),
      String(b.notes || "").slice(0, 2000),
      ts
    ).run();
    return json({ ok: true, voice_id: id });
  }

  // --- archive ---
  if (path === "/api/archive" && method === "GET") {
    if (!user || user.role !== "main") return json({ error: "main role required" }, 403);
    const { results: arch } = await db.prepare(`SELECT * FROM archived_voices ORDER BY archived_at DESC`).all();
    const { results: votes } = await db.prepare(`SELECT * FROM archive_votes`).all();
    const pending = {};
    for (const v of votes || []) {
      if (!pending[v.voice_id]) pending[v.voice_id] = [];
      pending[v.voice_id].push({ voter: v.voter, ts: v.created_at });
    }
    // drop pending for already archived
    const archivedIds = new Set((arch || []).map((a) => a.voice_id));
    for (const id of Object.keys(pending)) {
      if (archivedIds.has(id)) delete pending[id];
    }
    return json({ v: 1, archived: arch || [], pending });
  }

  if (path === "/api/archive/vote" && method === "POST") {
    if (!user || user.role !== "main") return json({ error: "main role required" }, 403);
    const b = await req.json().catch(() => null);
    const voice_id = String(b?.voice_id || "").slice(0, 128);
    if (!voice_id) return json({ error: "voice_id required" }, 400);
    const already = await db.prepare(`SELECT voice_id FROM archived_voices WHERE voice_id=?`).bind(voice_id).first();
    if (already) return json({ ok: true, archived: true, message: "already archived" });
    // one vote per main user (PK prevents double)
    try {
      await db.prepare(
        `INSERT INTO archive_votes (voice_id, voter, created_at) VALUES (?,?,?)`
      ).bind(voice_id, user.name, Date.now()).run();
    } catch {
      return json({ ok: true, duplicate: true, message: "already voted" });
    }
    await audit(db, user.name, "archive.vote", voice_id, "vote");
    const votes = await votesFor(db, voice_id);
    const voters = [...new Set(votes.map((v) => v.voter))];
    let archived = false;
    if (voters.length >= 2) {
      await db.prepare(
        `INSERT INTO archived_voices (voice_id, archived_at, voters_json) VALUES (?,?,?)
         ON CONFLICT(voice_id) DO UPDATE SET archived_at=excluded.archived_at, voters_json=excluded.voters_json`
      ).bind(voice_id, Date.now(), JSON.stringify(voters)).run();
      await audit(db, user.name, "archive.complete", voice_id, voters.join(","));
      archived = true;
    }
    return json({ ok: true, voice_id, votes: voters.length, voters, archived });
  }

  if (path === "/api/archive/vote" && method === "DELETE") {
    if (!user || user.role !== "main") return json({ error: "main role required" }, 403);
    const u = new URL(req.url);
    const voice_id = u.searchParams.get("voice_id") || "";
    if (!voice_id) return json({ error: "voice_id required" }, 400);
    await db.prepare(`DELETE FROM archive_votes WHERE voice_id=? AND voter=?`).bind(voice_id, user.name).run();
    await audit(db, user.name, "archive.unvote", voice_id, "");
    return json({ ok: true });
  }

  if (path === "/api/archive/restore" && method === "POST") {
    if (!user || user.role !== "main") return json({ error: "main role required" }, 403);
    const b = await req.json().catch(() => null);
    const voice_id = String(b?.voice_id || "").slice(0, 128);
    if (!voice_id) return json({ error: "voice_id required" }, 400);
    await db.prepare(`DELETE FROM archived_voices WHERE voice_id=?`).bind(voice_id).run();
    await db.prepare(`DELETE FROM archive_votes WHERE voice_id=?`).bind(voice_id).run();
    await audit(db, user.name, "archive.restore", voice_id, "");
    return json({ ok: true, restored: voice_id });
  }

  // --- audit ---
  if (path === "/api/audit" && method === "GET") {
    if (!user || user.role !== "main") return json({ error: "main role required" }, 403);
    const { results } = await db.prepare(`SELECT * FROM audit_log ORDER BY ts DESC LIMIT 200`).all();
    return json({ v: 1, entries: results || [] });
  }

  return json({ error: "not found" }, 404);
}

async function staticFile(path) {
  if (path === "/" || path === "") path = "/index.html";
  const allowed = new Set([
    "/index.html", "/config.json", "/schema.json", "/README.md",
    "/theme-test.html", "/favicon.ico", "/PLAN.md", "/versions/README.md",
  ]);
  if (!allowed.has(path)) return new Response("Not found", { status: 404, headers: CORS });
  const file = path.slice(1);
  const sources = [
    "https://cdn.jsdelivr.net/gh/dsactivi-2/bosnian-sales-voice-compare@" + COMMIT + "/" + file,
    "https://raw.githubusercontent.com/dsactivi-2/bosnian-sales-voice-compare/" + COMMIT + "/" + file,
  ];
  let last = "no source";
  for (const src of sources) {
    try {
      const res = await fetch(src, { headers: { "user-agent": "vc-worker/7", accept: "*/*" } });
      if (!res.ok) { last = res.status + " " + src; continue; }
      const body = await res.arrayBuffer();
      let type = "application/octet-stream";
      if (file.endsWith(".html")) type = "text/html;charset=utf-8";
      else if (file.endsWith(".json")) type = "application/json;charset=utf-8";
      else if (file.endsWith(".md")) type = "text/markdown;charset=utf-8";
      return new Response(body, {
        headers: { "content-type": type, "cache-control": "no-store", "x-vc-commit": COMMIT, "x-vc-version": APP_VERSION, ...CORS },
      });
    } catch (e) { last = String(e); }
  }
  return new Response("Upstream error: " + last, { status: 502, headers: CORS });
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    const path = new URL(req.url).pathname;
    if (path.startsWith("/api/")) return api(req, env, path);
    return staticFile(path);
  },
};
