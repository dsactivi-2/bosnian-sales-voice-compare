#!/usr/bin/env node
/**
 * Voice Compare MCP Server (zero dependency, stdio JSON-RPC)
 *
 * Tools for Claude / Cursor / OpenAI Agents / Hermes / Grok-compatible MCP hosts:
 *   list_voices, get_config, add_voice, update_voice, remove_voice,
 *   set_script, set_reviewers, validate_config, write_config
 *
 * Usage:
 *   node mcp/server.mjs
 *   VOICE_COMPARE_ROOT=/path/to/voice-compare node mcp/server.mjs
 *
 * Config path (first match):
 *   $VOICE_COMPARE_CONFIG
 *   $VOICE_COMPARE_ROOT/config.json
 *   ../config.json (relative to this file)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.VOICE_COMPARE_ROOT
  ? path.resolve(process.env.VOICE_COMPARE_ROOT)
  : path.resolve(__dirname, "..");
const CONFIG_PATH = process.env.VOICE_COMPARE_CONFIG
  ? path.resolve(process.env.VOICE_COMPARE_CONFIG)
  : path.join(ROOT, "config.json");

function readConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, "utf8");
  return JSON.parse(raw);
}

function writeConfig(cfg) {
  const errs = validate(cfg);
  if (errs.length) throw new Error("Invalid config: " + errs.join("; "));
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2) + "\n", "utf8");
  return cfg;
}

function validate(cfg) {
  const errs = [];
  if (!cfg || typeof cfg !== "object") return ["not an object"];
  if (!cfg.project?.title) errs.push("project.title required");
  if (!cfg.script) errs.push("script required");
  if (!Array.isArray(cfg.reviewers) || !cfg.reviewers.length) errs.push("reviewers[] required");
  if (!Array.isArray(cfg.categories) || !cfg.categories.length) errs.push("categories[] required");
  if (!Array.isArray(cfg.voices) || !cfg.voices.length) errs.push("voices[] required");
  const ids = new Set();
  for (const [i, v] of (cfg.voices || []).entries()) {
    if (!v.id) errs.push(`voices[${i}].id required`);
    if (!v.title) errs.push(`voices[${i}].title required`);
    if (!v.audio) errs.push(`voices[${i}].audio required`);
    if (!["m", "f", "x"].includes(v.sex)) errs.push(`voices[${i}].sex must be m|f|x`);
    if (v.id && ids.has(v.id)) errs.push(`duplicate id ${v.id}`);
    if (v.id) ids.add(v.id);
  }
  return errs;
}

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

const TOOLS = [
  {
    name: "get_config",
    description: "Read the full voice-compare config.json (project, script, reviewers, categories, voices).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "list_voices",
    description: "List all voices in the catalog with id, title, sex, audio, tags, note.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "validate_config",
    description: "Validate current config.json (or provided config object) against project rules.",
    inputSchema: {
      type: "object",
      properties: {
        config: { type: "object", description: "Optional config object; defaults to file on disk" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "add_voice",
    description:
      "Add a voice to config.json. Required: id (Fish voice_id or stable slug), title, sex (m|f|x), audio (public mp3 URL). Optional note, tags[].",
    inputSchema: {
      type: "object",
      required: ["id", "title", "sex", "audio"],
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        sex: { type: "string", enum: ["m", "f", "x"] },
        audio: { type: "string", description: "Public HTTPS mp3 URL" },
        note: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
      },
      additionalProperties: false,
    },
  },
  {
    name: "update_voice",
    description: "Update fields of an existing voice by id.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        sex: { type: "string", enum: ["m", "f", "x"] },
        audio: { type: "string" },
        note: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
      },
      additionalProperties: false,
    },
  },
  {
    name: "remove_voice",
    description: "Remove a voice by id. Keeps at least one voice.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string" } },
      additionalProperties: false,
    },
  },
  {
    name: "set_script",
    description: "Set the shared TTS / comparison script used for all voices.",
    inputSchema: {
      type: "object",
      required: ["script"],
      properties: { script: { type: "string" } },
      additionalProperties: false,
    },
  },
  {
    name: "set_reviewers",
    description: "Replace the reviewer name list (e.g. Arman, Denis, Osoba 3).",
    inputSchema: {
      type: "object",
      required: ["reviewers"],
      properties: {
        reviewers: { type: "array", items: { type: "string" }, minItems: 1 },
      },
      additionalProperties: false,
    },
  },
  {
    name: "write_config",
    description: "Replace entire config.json with a full valid config object (use carefully).",
    inputSchema: {
      type: "object",
      required: ["config"],
      properties: { config: { type: "object" } },
      additionalProperties: false,
    },
  },
  {
    name: "get_paths",
    description: "Return config path, live URL, repo URL, and how to open the dashboard.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
];

function toolResult(obj) {
  return {
    content: [{ type: "text", text: typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) }],
  };
}

function callTool(name, args = {}) {
  switch (name) {
    case "get_config":
      return toolResult(readConfig());
    case "list_voices":
      return toolResult(readConfig().voices);
    case "validate_config": {
      const cfg = args.config || readConfig();
      const errors = validate(cfg);
      return toolResult({ ok: errors.length === 0, errors, path: CONFIG_PATH });
    }
    case "add_voice": {
      const cfg = clone(readConfig());
      if (cfg.voices.some((v) => v.id === args.id)) throw new Error("id already exists: " + args.id);
      cfg.voices.push({
        id: args.id,
        title: args.title,
        sex: args.sex,
        audio: args.audio,
        note: args.note || "",
        tags: args.tags || [],
      });
      writeConfig(cfg);
      return toolResult({ ok: true, count: cfg.voices.length, voice: cfg.voices.at(-1) });
    }
    case "update_voice": {
      const cfg = clone(readConfig());
      const i = cfg.voices.findIndex((v) => v.id === args.id);
      if (i < 0) throw new Error("voice not found: " + args.id);
      const { id, ...rest } = args;
      cfg.voices[i] = { ...cfg.voices[i], ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)) };
      writeConfig(cfg);
      return toolResult({ ok: true, voice: cfg.voices[i] });
    }
    case "remove_voice": {
      const cfg = clone(readConfig());
      const next = cfg.voices.filter((v) => v.id !== args.id);
      if (next.length === cfg.voices.length) throw new Error("voice not found: " + args.id);
      if (!next.length) throw new Error("cannot remove last voice");
      cfg.voices = next;
      writeConfig(cfg);
      return toolResult({ ok: true, count: cfg.voices.length });
    }
    case "set_script": {
      const cfg = clone(readConfig());
      cfg.script = args.script;
      writeConfig(cfg);
      return toolResult({ ok: true });
    }
    case "set_reviewers": {
      const cfg = clone(readConfig());
      cfg.reviewers = args.reviewers;
      writeConfig(cfg);
      return toolResult({ ok: true, reviewers: cfg.reviewers });
    }
    case "write_config": {
      writeConfig(args.config);
      return toolResult({ ok: true, path: CONFIG_PATH });
    }
    case "get_paths": {
      const cfg = readConfig();
      return toolResult({
        configPath: CONFIG_PATH,
        root: ROOT,
        liveUrl: cfg.project?.liveUrl || null,
        repo: cfg.project?.repo || null,
        howToDeploy: "Commit config.json + index.html, deploy static host; dashboard loads config.json at runtime.",
        howToAddVoiceManually:
          "Edit voices[] in config.json: { id, title, sex: m|f|x, audio, note?, tags? }. Keep script identical for fair compare.",
      });
    }
    default:
      throw new Error("Unknown tool: " + name);
  }
}

// --- Minimal MCP stdio (JSON-RPC 2.0, Content-Length framing optional; also line-delimited) ---
let buffer = Buffer.alloc(0);
let useContentLength = null;

function send(msg) {
  const body = JSON.stringify(msg);
  if (useContentLength !== false) {
    const header = `Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n`;
    process.stdout.write(header + body);
  } else {
    process.stdout.write(body + "\n");
  }
}

function handleMessage(msg) {
  const { id, method, params } = msg;
  const reply = (result) => {
    if (id !== undefined && id !== null) send({ jsonrpc: "2.0", id, result });
  };
  const fail = (code, message) => {
    if (id !== undefined && id !== null) send({ jsonrpc: "2.0", id, error: { code, message } });
  };

  try {
    if (method === "initialize") {
      reply({
        protocolVersion: params?.protocolVersion || "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "voice-compare", version: "1.0.0" },
      });
      return;
    }
    if (method === "notifications/initialized" || method === "initialized") return;
    if (method === "ping") {
      reply({});
      return;
    }
    if (method === "tools/list") {
      reply({ tools: TOOLS });
      return;
    }
    if (method === "tools/call") {
      const name = params?.name;
      const args = params?.arguments || {};
      try {
        const result = callTool(name, args);
        reply(result);
      } catch (e) {
        reply({
          content: [{ type: "text", text: "Error: " + e.message }],
          isError: true,
        });
      }
      return;
    }
    // ignore other notifications
    if (String(method || "").startsWith("notifications/")) return;
    fail(-32601, "Method not found: " + method);
  } catch (e) {
    fail(-32603, e.message);
  }
}

function processBuffer() {
  while (true) {
    if (useContentLength === null) {
      const s = buffer.toString("utf8");
      if (s.startsWith("{")) {
        useContentLength = false;
      } else if (/content-length:/i.test(s)) {
        useContentLength = true;
      } else if (buffer.length > 0 && !/\s/.test(s[0] || "")) {
        useContentLength = false;
      } else if (buffer.length > 64) {
        useContentLength = true;
      } else {
        return;
      }
    }

    if (useContentLength) {
      const headerEnd = buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) return;
      const header = buffer.slice(0, headerEnd).toString("utf8");
      const m = /content-length:\s*(\d+)/i.exec(header);
      if (!m) {
        buffer = buffer.slice(headerEnd + 4);
        continue;
      }
      const len = parseInt(m[1], 10);
      const start = headerEnd + 4;
      if (buffer.length < start + len) return;
      const body = buffer.slice(start, start + len).toString("utf8");
      buffer = buffer.slice(start + len);
      try {
        handleMessage(JSON.parse(body));
      } catch (e) {
        // ignore parse errors
      }
    } else {
      const nl = buffer.indexOf("\n");
      if (nl === -1) return;
      const line = buffer.slice(0, nl).toString("utf8").trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      try {
        handleMessage(JSON.parse(line));
      } catch {
        // ignore
      }
    }
  }
}

process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  processBuffer();
});
process.stdin.on("end", () => process.exit(0));

// stderr banner for humans
console.error(`[voice-compare-mcp] ready · config=${CONFIG_PATH}`);
