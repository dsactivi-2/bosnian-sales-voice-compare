/**
 * voice-compare.activi.io
 * - Static files from GitHub (pinned COMMIT)
 * - Ratings + voice profiles in Cloudflare D1 (binding: DB)
 */
const COMMIT = "PLACEHOLDER_COMMIT";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,PUT,POST,DELETE,OPTIONS",
  "access-control-allow-headers": "content-type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS, "cache-control": "no-store" },
  });
}

function clampScore(n) {
  n = Number(n);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(5, Math.round(n)));
}

function rowsToMap(rows) {
  const map = {};
  for (const r of rows) {
    map[r.voice_id + "|" + r.reviewer] = {
      pron: r.pron, prof: r.prof, warm: r.warm, clar: r.clar, emo: r.emo,
      comment: r.comment || "",
      ts: r.updated_at,
    };
  }
  return map;
}

async function ensureSchema(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS ratings (
      voice_id TEXT NOT NULL,
      reviewer TEXT NOT NULL,
      pron INTEGER NOT NULL DEFAULT 0,
      prof INTEGER NOT NULL DEFAULT 0,
      warm INTEGER NOT NULL DEFAULT 0,
      clar INTEGER NOT NULL DEFAULT 0,
      emo INTEGER NOT NULL DEFAULT 0,
      comment TEXT NOT NULL DEFAULT '',
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (voice_id, reviewer)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS voice_profiles (
      voice_id TEXT PRIMARY KEY,
      opening_tags TEXT NOT NULL DEFAULT '',
      objection_tags TEXT NOT NULL DEFAULT '',
      close_tags TEXT NOT NULL DEFAULT '',
      pace_note TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      updated_at INTEGER NOT NULL
    )`),
  ]);
}

async function handleApi(request, env, path) {
  const db = env.DB;
  if (!db) return json({ error: "DB binding missing" }, 500);
  await ensureSchema(db);

  if (path === "/api/health") {
    const c = await db.prepare("SELECT COUNT(*) AS n FROM ratings").first();
    return json({ ok: true, storage: "d1", ratings: c?.n ?? 0, commit: COMMIT });
  }

  if (path === "/api/ratings" && request.method === "GET") {
    const { results } = await db.prepare("SELECT * FROM ratings ORDER BY updated_at DESC").all();
    return json({ v: 1, storage: "d1", ratings: rowsToMap(results || []), count: (results || []).length });
  }

  if (path === "/api/ratings" && request.method === "PUT") {
    const body = await request.json().catch(() => null);
    if (!body || !body.voice_id || !body.reviewer) return json({ error: "voice_id and reviewer required" }, 400);
    const voice_id = String(body.voice_id).slice(0, 128);
    const reviewer = String(body.reviewer).slice(0, 64);
    const pron = clampScore(body.pron);
    const prof = clampScore(body.prof);
    const warm = clampScore(body.warm);
    const clar = clampScore(body.clar);
    const emo = clampScore(body.emo);
    const comment = String(body.comment || "").slice(0, 1000);
    const updated_at = Number(body.ts) || Date.now();
    await db.prepare(
      `INSERT INTO ratings (voice_id, reviewer, pron, prof, warm, clar, emo, comment, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(voice_id, reviewer) DO UPDATE SET
         pron=excluded.pron, prof=excluded.prof, warm=excluded.warm, clar=excluded.clar, emo=excluded.emo,
         comment=excluded.comment, updated_at=excluded.updated_at`
    ).bind(voice_id, reviewer, pron, prof, warm, clar, emo, comment, updated_at).run();
    return json({ ok: true, key: voice_id + "|" + reviewer });
  }

  if (path === "/api/ratings/bulk" && request.method === "PUT") {
    const body = await request.json().catch(() => null);
    const ratings = body?.ratings || body;
    if (!ratings || typeof ratings !== "object") return json({ error: "ratings object required" }, 400);
    const stmts = [];
    let n = 0;
    for (const [key, val] of Object.entries(ratings)) {
      if (!val || typeof val !== "object") continue;
      const parts = key.split("|");
      if (parts.length < 2) continue;
      const voice_id = parts[0].slice(0, 128);
      const reviewer = parts.slice(1).join("|").slice(0, 64);
      const updated_at = Number(val.ts) || Date.now();
      stmts.push(
        db.prepare(
          `INSERT INTO ratings (voice_id, reviewer, pron, prof, warm, clar, emo, comment, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(voice_id, reviewer) DO UPDATE SET
             pron=excluded.pron, prof=excluded.prof, warm=excluded.warm, clar=excluded.clar, emo=excluded.emo,
             comment=excluded.comment, updated_at=excluded.updated_at`
        ).bind(
          voice_id, reviewer,
          clampScore(val.pron), clampScore(val.prof), clampScore(val.warm), clampScore(val.clar), clampScore(val.emo),
          String(val.comment || "").slice(0, 1000), updated_at
        )
      );
      n++;
    }
    if (stmts.length) await db.batch(stmts);
    return json({ ok: true, upserted: n });
  }

  if (path === "/api/ratings" && request.method === "DELETE") {
    const url = new URL(request.url);
    const voice_id = url.searchParams.get("voice_id");
    const reviewer = url.searchParams.get("reviewer");
    if (voice_id && reviewer) {
      await db.prepare("DELETE FROM ratings WHERE voice_id = ? AND reviewer = ?").bind(voice_id, reviewer).run();
      return json({ ok: true, deleted: 1 });
    }
    if (url.searchParams.get("all") === "1") {
      await db.prepare("DELETE FROM ratings").run();
      return json({ ok: true, deleted: "all" });
    }
    return json({ error: "provide voice_id+reviewer or all=1" }, 400);
  }

  if (path === "/api/profiles" && request.method === "GET") {
    const { results } = await db.prepare("SELECT * FROM voice_profiles").all();
    const map = {};
    for (const r of results || []) {
      map[r.voice_id] = {
        opening_tags: r.opening_tags,
        objection_tags: r.objection_tags,
        close_tags: r.close_tags,
        pace_note: r.pace_note,
        notes: r.notes,
        ts: r.updated_at,
      };
    }
    return json({ v: 1, profiles: map });
  }

  if (path === "/api/profiles" && request.method === "PUT") {
    const body = await request.json().catch(() => null);
    if (!body?.voice_id) return json({ error: "voice_id required" }, 400);
    const voice_id = String(body.voice_id).slice(0, 128);
    const updated_at = Date.now();
    await db.prepare(
      `INSERT INTO voice_profiles (voice_id, opening_tags, objection_tags, close_tags, pace_note, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(voice_id) DO UPDATE SET
         opening_tags=excluded.opening_tags, objection_tags=excluded.objection_tags,
         close_tags=excluded.close_tags, pace_note=excluded.pace_note, notes=excluded.notes,
         updated_at=excluded.updated_at`
    ).bind(
      voice_id,
      String(body.opening_tags || "").slice(0, 200),
      String(body.objection_tags || "").slice(0, 200),
      String(body.close_tags || "").slice(0, 200),
      String(body.pace_note || "").slice(0, 500),
      String(body.notes || "").slice(0, 2000),
      updated_at
    ).run();
    return json({ ok: true, voice_id });
  }

  return json({ error: "not found" }, 404);
}

async function serveStatic(path) {
  if (path === "/" || path === "") path = "/index.html";
  const allowed = new Set(["/index.html", "/config.json", "/schema.json", "/README.md", "/theme-test.html", "/favicon.ico"]);
  if (!allowed.has(path)) return new Response("Not found", { status: 404, headers: CORS });
  const file = path.slice(1);
  const sources = [
    "https://cdn.jsdelivr.net/gh/dsactivi-2/bosnian-sales-voice-compare@" + COMMIT + "/" + file,
    "https://raw.githubusercontent.com/dsactivi-2/bosnian-sales-voice-compare/" + COMMIT + "/" + file,
  ];
  let last = "no source";
  for (const src of sources) {
    try {
      const res = await fetch(src, { headers: { "user-agent": "voice-compare-worker/5", accept: "*/*" } });
      if (!res.ok) { last = res.status + " " + src; continue; }
      const body = await res.arrayBuffer();
      let type = "application/octet-stream";
      if (file.endsWith(".html")) type = "text/html; charset=utf-8";
      else if (file.endsWith(".json")) type = "application/json; charset=utf-8";
      else if (file.endsWith(".md")) type = "text/markdown; charset=utf-8";
      return new Response(body, {
        headers: {
          "content-type": type,
          "cache-control": "no-store",
          "x-vc-commit": COMMIT,
          ...CORS,
        },
      });
    } catch (e) { last = String(e); }
  }
  return new Response("Upstream error: " + last, { status: 502, headers: CORS });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    const url = new URL(request.url);
    const path = url.pathname;
    if (path.startsWith("/api/")) return handleApi(request, env, path);
    return serveStatic(path);
  },
};
