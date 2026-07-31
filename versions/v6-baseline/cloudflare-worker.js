/** voice-compare.activi.io — static GitHub pin + D1 ratings */
const COMMIT = "9d55210";
const ADMIN_KEY = "vc-admin-2026";
const ALLOWED_REVIEWERS = new Set(["Arman", "Denis", "Osoba 3"]);
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,PUT,POST,DELETE,OPTIONS",
  "access-control-allow-headers": "content-type,x-admin-key",
};
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
  ]);
}
const UPSERT = `INSERT INTO ratings (voice_id,reviewer,pron,prof,warm,clar,emo,comment,updated_at)
  VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(voice_id,reviewer) DO UPDATE SET
  pron=excluded.pron,prof=excluded.prof,warm=excluded.warm,clar=excluded.clar,emo=excluded.emo,
  comment=excluded.comment,updated_at=excluded.updated_at`;

async function api(req, env, path) {
  const db = env.DB;
  if (!db) return json({ error: "DB binding missing" }, 500);
  await schema(db);
  if (path === "/api/health") {
    const c = await db.prepare("SELECT COUNT(*) AS n FROM ratings").first();
    return json({ ok: true, storage: "d1", ratings: c?.n ?? 0, commit: COMMIT, features: ["blind-ui", "personal-links", "admin-wipe-key", "reviewer-allowlist"] });
  }
  if (path === "/api/ratings" && req.method === "GET") {
    const { results } = await db.prepare("SELECT * FROM ratings ORDER BY updated_at DESC").all();
    return json({ v: 1, storage: "d1", ratings: toMap(results || []), count: (results || []).length });
  }
  if (path === "/api/ratings" && req.method === "PUT") {
    const b = await req.json().catch(() => null);
    if (!b?.voice_id || !b?.reviewer) return json({ error: "voice_id and reviewer required" }, 400);
    const reviewer = String(b.reviewer).slice(0, 64);
    if (!ALLOWED_REVIEWERS.has(reviewer)) return json({ error: "reviewer not allowed", allowed: [...ALLOWED_REVIEWERS] }, 403);
    const voice_id = String(b.voice_id).slice(0, 128);
    const ts = Number(b.ts) || Date.now();
    await db.prepare(UPSERT).bind(voice_id, reviewer, clamp(b.pron), clamp(b.prof), clamp(b.warm), clamp(b.clar), clamp(b.emo), String(b.comment || "").slice(0, 1000), ts).run();
    return json({ ok: true, key: voice_id + "|" + reviewer });
  }
  if (path === "/api/ratings/bulk" && req.method === "PUT") {
    const b = await req.json().catch(() => null);
    const ratings = b?.ratings || b;
    if (!ratings || typeof ratings !== "object") return json({ error: "ratings object required" }, 400);
    const stmts = []; let n = 0, skipped = 0;
    for (const [key, val] of Object.entries(ratings)) {
      if (!val || typeof val !== "object") continue;
      const p = key.split("|"); if (p.length < 2) continue;
      const voice_id = p[0].slice(0, 128);
      const reviewer = p.slice(1).join("|").slice(0, 64);
      if (!ALLOWED_REVIEWERS.has(reviewer)) { skipped++; continue; }
      const ts = Number(val.ts) || Date.now();
      stmts.push(db.prepare(UPSERT).bind(voice_id, reviewer, clamp(val.pron), clamp(val.prof), clamp(val.warm), clamp(val.clar), clamp(val.emo), String(val.comment || "").slice(0, 1000), ts));
      n++;
    }
    if (stmts.length) await db.batch(stmts);
    return json({ ok: true, upserted: n, skipped });
  }
  if (path === "/api/ratings" && req.method === "DELETE") {
    const u = new URL(req.url);
    const voice_id = u.searchParams.get("voice_id");
    const reviewer = u.searchParams.get("reviewer");
    if (voice_id && reviewer) {
      if (!ALLOWED_REVIEWERS.has(reviewer)) return json({ error: "reviewer not allowed" }, 403);
      await db.prepare("DELETE FROM ratings WHERE voice_id=? AND reviewer=?").bind(voice_id, reviewer).run();
      return json({ ok: true, deleted: 1 });
    }
    if (u.searchParams.get("all") === "1") {
      const key = req.headers.get("x-admin-key") || "";
      if (key !== ADMIN_KEY) return json({ error: "admin key required for full wipe" }, 401);
      await db.prepare("DELETE FROM ratings").run();
      return json({ ok: true, deleted: "all" });
    }
    return json({ error: "provide voice_id+reviewer or all=1" }, 400);
  }
  if (path === "/api/profiles" && req.method === "GET") {
    const { results } = await db.prepare("SELECT * FROM voice_profiles").all();
    const m = {};
    for (const r of results || []) m[r.voice_id] = { opening_tags: r.opening_tags, objection_tags: r.objection_tags, close_tags: r.close_tags, pace_note: r.pace_note, notes: r.notes, ts: r.updated_at };
    return json({ v: 1, profiles: m });
  }
  if (path === "/api/profiles" && req.method === "PUT") {
    const b = await req.json().catch(() => null);
    if (!b?.voice_id) return json({ error: "voice_id required" }, 400);
    const id = String(b.voice_id).slice(0, 128), ts = Date.now();
    await db.prepare(`INSERT INTO voice_profiles (voice_id,opening_tags,objection_tags,close_tags,pace_note,notes,updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(voice_id) DO UPDATE SET opening_tags=excluded.opening_tags,objection_tags=excluded.objection_tags,close_tags=excluded.close_tags,pace_note=excluded.pace_note,notes=excluded.notes,updated_at=excluded.updated_at`).bind(id, String(b.opening_tags||"").slice(0,200), String(b.objection_tags||"").slice(0,200), String(b.close_tags||"").slice(0,200), String(b.pace_note||"").slice(0,500), String(b.notes||"").slice(0,2000), ts).run();
    return json({ ok: true, voice_id: id });
  }
  return json({ error: "not found" }, 404);
}
async function staticFile(path) {
  if (path === "/" || path === "") path = "/index.html";
  const allowed = new Set(["/index.html", "/config.json", "/schema.json", "/README.md", "/theme-test.html", "/favicon.ico", "/PLAN.md"]);
  if (!allowed.has(path)) return new Response("Not found", { status: 404, headers: CORS });
  const file = path.slice(1);
  const sources = [
    "https://cdn.jsdelivr.net/gh/dsactivi-2/bosnian-sales-voice-compare@" + COMMIT + "/" + file,
    "https://raw.githubusercontent.com/dsactivi-2/bosnian-sales-voice-compare/" + COMMIT + "/" + file,
  ];
  let last = "no source";
  for (const src of sources) {
    try {
      const res = await fetch(src, { headers: { "user-agent": "vc-worker/6", accept: "*/*" } });
      if (!res.ok) { last = res.status + " " + src; continue; }
      const body = await res.arrayBuffer();
      let type = "application/octet-stream";
      if (file.endsWith(".html")) type = "text/html;charset=utf-8";
      else if (file.endsWith(".json")) type = "application/json;charset=utf-8";
      else if (file.endsWith(".md")) type = "text/markdown;charset=utf-8";
      return new Response(body, { headers: { "content-type": type, "cache-control": "no-store", "x-vc-commit": COMMIT, ...CORS } });
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
