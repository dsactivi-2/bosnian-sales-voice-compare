/**
 * voice-compare.activi.io
 * Tool version: 7.3.1 (Auto-Phonetik im Bewertungsmaßstab) (phases A+B+C + archive.vote bind fix)
 * - Static files from GitHub (pinned COMMIT)
 * - D1: ratings, users, archive, audit
 */
const COMMIT = "e68af0c"; // pin: esc() fix via string-concat entities
const APP_VERSION = "7.3.1";
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
    db.prepare(`CREATE TABLE IF NOT EXISTS phonetic_results (
      voice_id TEXT PRIMARY KEY,
      audio_url TEXT NOT NULL DEFAULT '',
      expected_text TEXT NOT NULL DEFAULT '',
      transcript TEXT NOT NULL DEFAULT '',
      score INTEGER NOT NULL DEFAULT 0,
      word_recall REAL NOT NULL DEFAULT 0,
      word_precision REAL NOT NULL DEFAULT 0,
      char_ratio REAL NOT NULL DEFAULT 0,
      model TEXT NOT NULL DEFAULT '',
      language TEXT NOT NULL DEFAULT 'bs',
      error TEXT NOT NULL DEFAULT '',
      updated_at INTEGER NOT NULL,
      updated_by TEXT NOT NULL DEFAULT '')`),
  ]);
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
  const { results } = await db.prepare(`SELECT voter, created_at FROM archive_votes WHERE voice_id=?`).bind(voice_id).all();
  return results || [];
}

function stripFishTags(s) {
  return String(s || "").replace(/\[[^\]]*\]/g, " ");
}
function normText(s) {
  return stripFishTags(s)
    .toLowerCase()
    .replace(/["""„«»]/g, "")
    .replace(/[—–-]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function tokens(s) {
  return normText(s).split(" ").filter(Boolean);
}
function charRatio(a, b) {
  a = normText(a); b = normText(b);
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const m = a.length, n = b.length;
  if (m * n > 250000) {
    const ta = new Set(tokens(a)), tb = new Set(tokens(b));
    let inter = 0;
    for (const t of ta) if (tb.has(t)) inter++;
    return inter / Math.max(ta.size, tb.size, 1);
  }
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return 1 - dp[n] / Math.max(m, n);
}
function phoneticDiff(expected, transcript) {
  const e = tokens(expected);
  const a = tokens(transcript);
  const eSet = new Set(e);
  const aSet = new Set(a);
  let hit = 0;
  for (const t of eSet) if (aSet.has(t)) hit++;
  const recall = eSet.size ? hit / eSet.size : 0;
  const precision = aSet.size ? hit / aSet.size : 0;
  const f1 = (precision + recall) ? (2 * precision * recall) / (precision + recall) : 0;
  const cr = charRatio(expected, transcript);
  const score = Math.round(100 * (0.55 * f1 + 0.45 * cr));
  const missing = [...eSet].filter((t) => !aSet.has(t)).slice(0, 24);
  const extra = [...aSet].filter((t) => !eSet.has(t)).slice(0, 24);
  return {
    score: Math.max(0, Math.min(100, score)),
    word_recall: Math.round(recall * 1000) / 1000,
    word_precision: Math.round(precision * 1000) / 1000,
    char_ratio: Math.round(cr * 1000) / 1000,
    missing,
    extra,
  };
}
async function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
async function fishStt(env, audioUrl, language) {
  const key = env.FISH_API_KEY;
  if (!key) {
    const err = new Error("FISH_API_KEY missing — set Worker secret");
    err.code = "NO_FISH_KEY";
    throw err;
  }
  const audioRes = await fetch(audioUrl, { headers: { accept: "*/*", "user-agent": "vc-worker-phonetik/1" } });
  if (!audioRes.ok) throw new Error("audio fetch " + audioRes.status + " " + audioUrl.slice(0, 120));
  const buf = await audioRes.arrayBuffer();
  if (buf.byteLength < 500) throw new Error("audio too small: " + buf.byteLength);
  if (buf.byteLength > 18_000_000) throw new Error("audio too large: " + buf.byteLength);
  const b64 = await arrayBufferToBase64(buf);
  const res = await fetch("https://api.fish.audio/v1/asr", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ audio: b64, language: language || "bs", ignore_timestamps: true }),
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* raw */ }
  if (!res.ok) throw new Error("Fish ASR " + res.status + ": " + String(text).slice(0, 240));
  const transcript = String(data?.text || data?.transcript || "").trim();
  return { transcript, raw: data, model: "fish-asr" };
}
async function upsertPhonetic(db, row) {
  await db.prepare(
    `INSERT INTO phonetic_results (voice_id,audio_url,expected_text,transcript,score,word_recall,word_precision,char_ratio,model,language,error,updated_at,updated_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(voice_id) DO UPDATE SET
       audio_url=excluded.audio_url, expected_text=excluded.expected_text, transcript=excluded.transcript,
       score=excluded.score, word_recall=excluded.word_recall, word_precision=excluded.word_precision,
       char_ratio=excluded.char_ratio, model=excluded.model, language=excluded.language,
       error=excluded.error, updated_at=excluded.updated_at, updated_by=excluded.updated_by`
  ).bind(
    row.voice_id, row.audio_url, row.expected_text, row.transcript,
    row.score, row.word_recall, row.word_precision, row.char_ratio,
    row.model, row.language, row.error, row.updated_at, row.updated_by
  ).run();
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
        "auto-phonetik",
      ],
      fishKey: Boolean(env.FISH_API_KEY),
    });
  }

  if (path === "/api/me" && method === "GET") {
    if (!user) return json({ ok: false, user: null });
    return json({ ok: true, user: { id: user.id, name: user.name, role: user.role, token: user.token, via: user.via } });
  }

  if (path === "/api/users" && method === "GET") {
    if (!user) return json({ error: "auth required" }, 401);
    const all = await listActiveUsers(db);
    if (user.role === "main") {
      return json({ v: 1, users: all.map((u) => ({ id: u.id, name: u.name, role: u.role, token: u.token, active: u.active, created_at: u.created_at, created_by: u.created_by, linkPath: u.role === "main" ? `?me=${encodeURIComponent(u.name)}` : `?u=${encodeURIComponent(u.token)}` })) });
    }
    return json({ v: 1, users: all.filter((u) => u.id === user.id).map((u) => ({ id: u.id, name: u.name, role: u.role, token: u.token, active: u.active, created_at: u.created_at, linkPath: `?u=${encodeURIComponent(u.token)}` })) });
  }

  if (path === "/api/users" && method === "POST") {
    if (!user || user.role !== "main") return json({ error: "main role required" }, 403);
    const b = await req.json().catch(() => null);
    const name = String(b?.name || "").trim().slice(0, 64);
    if (!name) return json({ error: "name required" }, 400);
    if (MAIN_SEED.some((m) => m.name.toLowerCase() === name.toLowerCase())) return json({ error: "name reserved for main user" }, 400);
    const exists = await db.prepare(`SELECT id FROM users WHERE lower(name)=lower(?) AND active=1`).bind(name).first();
    if (exists) return json({ error: "name already exists" }, 409);
    const id = uid("tester");
    const tok = token();
    const ts = Date.now();
    await db.prepare(`INSERT INTO users (id,name,role,token,active,created_at,created_by) VALUES (?,?,?,?,1,?,?)`).bind(id, name, "tester", tok, ts, user.name).run();
    await audit(db, user.name, "user.create", "", name);
    return json({ ok: true, user: { id, name, role: "tester", token: tok, linkPath: `?u=${encodeURIComponent(tok)}` } });
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

  if (path === "/api/ratings" && method === "GET") {
    const arch = await archivedSet(db);
    const { results } = await db.prepare("SELECT * FROM ratings ORDER BY updated_at DESC").all();
    let rows = results || [];
    if (user?.role === "tester") rows = rows.filter((r) => r.reviewer === user.name && !arch.has(r.voice_id));
    else if (!user) rows = rows.filter((r) => !arch.has(r.voice_id));
    return json({ v: 1, storage: "d1", ratings: toMap(rows), count: rows.length, archivedIds: user?.role === "main" ? [...arch] : [] });
  }

  if (path === "/api/ratings" && method === "PUT") {
    const b = await req.json().catch(() => null);
    if (!b?.voice_id || !b?.reviewer) return json({ error: "voice_id and reviewer required" }, 400);
    const reviewer = String(b.reviewer).slice(0, 64);
    const allowed = await db.prepare(`SELECT name, role FROM users WHERE name=? AND active=1`).bind(reviewer).first();
    if (!allowed) return json({ error: "reviewer not allowed" }, 403);
    if (user && user.name !== reviewer) return json({ error: "cannot rate as another user" }, 403);
    const arch = await archivedSet(db);
    const voice_id = String(b.voice_id).slice(0, 128);
    if (arch.has(voice_id) && allowed.role !== "main") return json({ error: "voice archived" }, 403);
    const ts = Number(b.ts) || Date.now();
    await db.prepare(UPSERT).bind(voice_id, reviewer, clamp(b.pron), clamp(b.prof), clamp(b.warm), clamp(b.clar), clamp(b.emo), String(b.comment || "").slice(0, 1000), ts).run();
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
      stmts.push(db.prepare(UPSERT).bind(voice_id, reviewer, clamp(val.pron), clamp(val.prof), clamp(val.warm), clamp(val.clar), clamp(val.emo), String(val.comment || "").slice(0, 1000), ts));
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
      if (user && user.name !== reviewer && user.role !== "main") return json({ error: "forbidden" }, 403);
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

  if (path === "/api/profiles" && method === "GET") {
    const { results } = await db.prepare("SELECT * FROM voice_profiles").all();
    const m = {};
    for (const r of results || []) m[r.voice_id] = { opening_tags: r.opening_tags, objection_tags: r.objection_tags, close_tags: r.close_tags, pace_note: r.pace_note, notes: r.notes, ts: r.updated_at };
    return json({ v: 1, profiles: m });
  }
  if (path === "/api/profiles" && method === "PUT") {
    if (!user || user.role !== "main") return json({ error: "main role required" }, 403);
    const b = await req.json().catch(() => null);
    if (!b?.voice_id) return json({ error: "voice_id required" }, 400);
    const id = String(b.voice_id).slice(0, 128);
    const ts = Date.now();
    await db.prepare(`INSERT INTO voice_profiles (voice_id,opening_tags,objection_tags,close_tags,pace_note,notes,updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(voice_id) DO UPDATE SET opening_tags=excluded.opening_tags,objection_tags=excluded.objection_tags,close_tags=excluded.close_tags,pace_note=excluded.pace_note,notes=excluded.notes,updated_at=excluded.updated_at`).bind(id, String(b.opening_tags || "").slice(0, 200), String(b.objection_tags || "").slice(0, 200), String(b.close_tags || "").slice(0, 200), String(b.pace_note || "").slice(0, 500), String(b.notes || "").slice(0, 2000), ts).run();
    return json({ ok: true, voice_id: id });
  }

  if (path === "/api/archive" && method === "GET") {
    if (!user || user.role !== "main") return json({ error: "main role required" }, 403);
    const { results: arch } = await db.prepare(`SELECT * FROM archived_voices ORDER BY archived_at DESC`).all();
    const { results: votes } = await db.prepare(`SELECT * FROM archive_votes`).all();
    const pending = {};
    for (const v of votes || []) { if (!pending[v.voice_id]) pending[v.voice_id] = []; pending[v.voice_id].push({ voter: v.voter, ts: v.created_at }); }
    const archivedIds = new Set((arch || []).map((a) => a.voice_id));
    for (const id of Object.keys(pending)) if (archivedIds.has(id)) delete pending[id];
    return json({ v: 1, archived: arch || [], pending });
  }

  if (path === "/api/archive/vote" && method === "POST") {
    if (!user || user.role !== "main") return json({ error: "main role required" }, 403);
    const b = await req.json().catch(() => null);
    const voice_id = String(b?.voice_id || "").slice(0, 128);
    if (!voice_id) return json({ error: "voice_id required" }, 400);
    try {
      const already = await db.prepare(`SELECT voice_id FROM archived_voices WHERE voice_id=?`).bind(voice_id).first();
      if (already) return json({ ok: true, archived: true, message: "already archived" });
      try {
        await db.prepare(`INSERT INTO archive_votes (voice_id, voter, created_at) VALUES (?,?,?)`).bind(voice_id, user.name, Date.now()).run();
      } catch {
        const votesDup = await votesFor(db, voice_id);
        const votersDup = [...new Set(votesDup.map((v) => v.voter))];
        return json({ ok: true, duplicate: true, message: "already voted", voice_id, votes: votersDup.length, voters: votersDup, archived: votersDup.length >= 2 });
      }
      await audit(db, user.name, "archive.vote", voice_id, "vote");
      const votes = await votesFor(db, voice_id);
      const voters = [...new Set(votes.map((v) => v.voter))];
      let archived = false;
      if (voters.length >= 2) {
        await db.prepare("INSERT INTO archived_voices (voice_id, archived_at, voters_json) VALUES (?,?,?) ON CONFLICT(voice_id) DO UPDATE SET archived_at=excluded.archived_at, voters_json=excluded.voters_json").bind(voice_id, Date.now(), JSON.stringify(voters)).run();
        await audit(db, user.name, "archive.complete", voice_id, voters.join(","));
        archived = true;
      }
      return json({ ok: true, voice_id, votes: voters.length, voters, archived });
    } catch (e) {
      return json({ error: "archive.vote failed", detail: String(e && e.message || e).slice(0, 300) }, 500);
    }
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

  if (path === "/api/audit" && method === "GET") {
    if (!user || user.role !== "main") return json({ error: "main role required" }, 403);
    const { results } = await db.prepare(`SELECT * FROM audit_log ORDER BY ts DESC LIMIT 200`).all();
    return json({ v: 1, entries: results || [] });
  }

  if (path === "/api/phonetic" && method === "GET") {
    if (!user) return json({ error: "auth required" }, 401);
    const { results } = await db.prepare(`SELECT voice_id,audio_url,expected_text,transcript,score,word_recall,word_precision,char_ratio,model,language,error,updated_at,updated_by FROM phonetic_results ORDER BY score ASC, updated_at DESC`).all();
    const map = {};
    for (const r of results || []) map[r.voice_id] = r;
    return json({ v: 1, count: (results || []).length, fishKey: Boolean(env.FISH_API_KEY), results: map, list: results || [] });
  }

  if (path === "/api/phonetic/run" && method === "POST") {
    if (!user || user.role !== "main") return json({ error: "main role required" }, 403);
    const b = await req.json().catch(() => null);
    const voice_id = String(b?.voice_id || "").slice(0, 128);
    const audio_url = String(b?.audio_url || "").slice(0, 500);
    const expected_text = String(b?.expected_text || "").slice(0, 4000);
    const language = String(b?.language || "bs").slice(0, 8);
    if (!voice_id || !audio_url || !expected_text) return json({ error: "voice_id, audio_url, expected_text required" }, 400);
    try {
      const { transcript, model } = await fishStt(env, audio_url, language);
      const d = phoneticDiff(expected_text, transcript);
      const row = { voice_id, audio_url, expected_text, transcript, score: d.score, word_recall: d.word_recall, word_precision: d.word_precision, char_ratio: d.char_ratio, model, language, error: "", updated_at: Date.now(), updated_by: user.name };
      await upsertPhonetic(db, row);
      await audit(db, user.name, "phonetic.run", voice_id, "score=" + d.score);
      return json({ ok: true, result: { ...row, missing: d.missing, extra: d.extra } });
    } catch (e) {
      const msg = String(e && e.message || e).slice(0, 400);
      const row = { voice_id, audio_url, expected_text, transcript: "", score: 0, word_recall: 0, word_precision: 0, char_ratio: 0, model: "", language, error: msg, updated_at: Date.now(), updated_by: user.name };
      await upsertPhonetic(db, row);
      const status = e && e.code === "NO_FISH_KEY" ? 503 : 500;
      return json({ ok: false, error: msg, result: row }, status);
    }
  }

  if (path === "/api/phonetic/ingest" && method === "POST") {
    const b = await req.json().catch(() => null);
    const admin = (req.headers.get("x-admin-key") || "") === ADMIN_KEY;
    if (!admin && (!user || user.role !== "main")) return json({ error: "main or admin key required" }, 403);
    const items = Array.isArray(b?.results) ? b.results : (b?.voice_id ? [b] : null);
    if (!items || !items.length) return json({ error: "results[] or single result required" }, 400);
    let n = 0;
    const out = [];
    for (const it of items.slice(0, 50)) {
      const voice_id = String(it.voice_id || "").slice(0, 128);
      const expected_text = String(it.expected_text || "").slice(0, 4000);
      const transcript = String(it.transcript || "").slice(0, 4000);
      if (!voice_id || !expected_text) continue;
      const d = phoneticDiff(expected_text, transcript);
      const row = { voice_id, audio_url: String(it.audio_url || "").slice(0, 500), expected_text, transcript, score: Number.isFinite(Number(it.score)) ? Math.round(Number(it.score)) : d.score, word_recall: d.word_recall, word_precision: d.word_precision, char_ratio: d.char_ratio, model: String(it.model || "ingest").slice(0, 64), language: String(it.language || "bs").slice(0, 8), error: String(it.error || "").slice(0, 400), updated_at: Date.now(), updated_by: user?.name || "admin" };
      await upsertPhonetic(db, row);
      n++;
      out.push({ voice_id, score: row.score });
    }
    await audit(db, user?.name || "admin", "phonetic.ingest", "", "n=" + n);
    return json({ ok: true, upserted: n, results: out });
  }

  if (path === "/api/phonetic" && method === "DELETE") {
    if (!user || user.role !== "main") return json({ error: "main role required" }, 403);
    const u = new URL(req.url);
    const voice_id = u.searchParams.get("voice_id") || "";
    if (u.searchParams.get("all") === "1") {
      if ((req.headers.get("x-admin-key") || "") !== ADMIN_KEY) return json({ error: "admin key required" }, 401);
      await db.prepare(`DELETE FROM phonetic_results`).run();
      await audit(db, user.name, "phonetic.wipe", "", "all");
      return json({ ok: true, deleted: "all" });
    }
    if (!voice_id) return json({ error: "voice_id or all=1" }, 400);
    await db.prepare(`DELETE FROM phonetic_results WHERE voice_id=?`).bind(voice_id).run();
    return json({ ok: true, deleted: voice_id });
  }

  return json({ error: "not found" }, 404);
}

async function staticFile(path) {
  if (path === "/" || path === "") path = "/index.html";
  const allowed = new Set(["/index.html", "/config.json", "/schema.json", "/README.md", "/theme-test.html", "/favicon.ico", "/PLAN.md", "/versions/README.md"]);
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
    try {
      if (path.startsWith("/api/")) return await api(req, env, path);
      return await staticFile(path);
    } catch (e) {
      return json({ error: "worker exception", detail: String(e && e.message || e).slice(0, 400), path }, 500);
    }
  },
};
