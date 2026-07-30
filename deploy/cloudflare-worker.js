/** Cloudflare Worker for voice-compare.activi.io — pin COMMIT after each deploy */
const COMMIT = "ec44fc2";
export default {
  async fetch(request) {
    const url = new URL(request.url);
    let path = url.pathname;
    if (path === "/" || path === "") path = "/index.html";
    const allowed = new Set(["/index.html", "/config.json", "/schema.json", "/README.md", "/favicon.ico"]);
    if (!allowed.has(path)) return new Response("Not found", { status: 404 });
    const file = path.slice(1);
    const sources = [
      "https://raw.githubusercontent.com/dsactivi-2/bosnian-sales-voice-compare/" + COMMIT + "/" + file,
      "https://cdn.jsdelivr.net/gh/dsactivi-2/bosnian-sales-voice-compare@" + COMMIT + "/" + file,
      "https://raw.githubusercontent.com/dsactivi-2/bosnian-sales-voice-compare/main/" + file,
    ];
    let last = "no source";
    for (const src of sources) {
      try {
        const res = await fetch(src, {
          headers: { "user-agent": "voice-compare-worker/2.1", accept: "*/*", "cache-control": "no-cache" },
          cf: { cacheTtl: 0, cacheEverything: false },
        });
        if (!res.ok) {
          last = "status " + res.status + " from " + src;
          continue;
        }
        const body = await res.arrayBuffer();
        let type = "application/octet-stream";
        if (file.endsWith(".html")) type = "text/html; charset=utf-8";
        else if (file.endsWith(".json")) type = "application/json; charset=utf-8";
        else if (file.endsWith(".md")) type = "text/markdown; charset=utf-8";
        return new Response(body, {
          headers: {
            "content-type": type,
            "cache-control": "public, max-age=30",
            "access-control-allow-origin": "*",
            "x-content-type-options": "nosniff",
            "x-vc-commit": COMMIT,
          },
        });
      } catch (e) {
        last = String(e);
      }
    }
    return new Response("Upstream error: " + last, { status: 502 });
  },
};
