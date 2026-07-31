---
name: voice-compare
description: "Manage bosnian tele-sales voice comparison catalog (config.json voices, script, reviewers). Use when adding/swapping Fish Audio voices, updating TTS script, deploying voice-compare dashboard, or helping team rate BS sales voices."
type: tool
lifecycle: active
metadata:
  short-description: "Add/edit voices for voice-compare dashboard + team ratings"
  platforms: [claude, grok, openai, hermes, cursor]
---

# Voice Compare — Agent Skill (Claude · Grok · OpenAI · Hermes)

Single source of truth for the team dashboard:

| File | Role |
|---|---|
| `config.json` | **All voices, script, reviewers, categories** |
| `index.html` | UI (loads `config.json`; team ratings via Worker → D1) |
| `deploy/cloudflare-worker.js` | Static pin + D1 API (allowlist, admin wipe) |
| `schema.json` | JSON Schema for config |
| `mcp/server.mjs` | MCP tools to edit config safely |
| Live | https://voice-compare.activi.io/ |
| Repo | https://github.com/dsactivi-2/bosnian-sales-voice-compare |

## When to use this skill

- User wants to **add / replace / reorder / remove** comparison voices
- User changes the **shared sales script** or **reviewer names**
- Agent generates a new Fish Audio sample and should **register it** in the catalog
- User asks how the team rates voices

**Do not** invent parallel catalogs. Always edit `config.json` (or MCP tools that write it).

---

## Voice object (minimal)

```json
{
  "id": "020fa2f81d65408383cd6e21d6be2f2d",
  "title": "Samouvjeren bosanski glas",
  "sex": "m",
  "note": "Starker Allround-Sales-Kandidat",
  "tags": ["conversational", "confident"],
  "audio": "https://platform.r2.fish.audio/tasks/.../file.mp3"
}
```

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Prefer Fish `voice_id`; must be unique & stable (ratings key off this) |
| `title` | yes | Human label in UI |
| `sex` | yes | `m` \| `f` \| `x` |
| `audio` | yes | Public HTTPS MP3 URL (Fish task URL or CDN) |
| `note` | no | Why this voice is in the shortlist |
| `tags` | no | Free tags for filters/display |

Changing `id` **orphans** existing ratings for that voice. Prefer update in place.

---

## Workflow A — Add a new Fish voice (recommended)

1. **Pick / search voice** (Fish Audio skill or tools): `search_voices` language `bs` / Bosnian-capable.
2. **TTS** with the **same** `script` from `config.json` (fair A/B):
   - Prefer s2.x + bracket tags already in script (`[friendly]`, `[pause]`, `[emphasis]`).
3. Take permanent **audio URL** from TTS result.
4. Register voice:
   - **MCP:** `add_voice` with `{ id, title, sex, audio, note?, tags? }`
   - **Or manual:** append object to `config.json` → `voices[]`
5. Validate: MCP `validate_config` or ensure schema fields present.
6. Deploy static files (`config.json` + `index.html`) so live URL updates.
7. Tell team: open live URL → refresh → new card appears. Ratings stay per browser.

## Workflow B — Swap sample only (keep ratings)

- Same `id`, new `audio` (+ optional title/note) via MCP `update_voice`.
- Team keeps prior scores for that id.

## Workflow C — UI-only draft (no deploy)

- Open dashboard → tab **Stimmen** → add/edit → **Config exportieren**.
- Paste into repo `config.json` and commit. Browser draft is **not** shared with team until deployed.

---

## MCP server (all hosts)

Zero-dependency Node stdio server:

```bash
node mcp/server.mjs
# or
VOICE_COMPARE_ROOT=/path/to/repo node mcp/server.mjs
```

### Tools

| Tool | Purpose |
|---|---|
| `get_config` / `list_voices` | Read catalog |
| `add_voice` / `update_voice` / `remove_voice` | Mutate voices |
| `set_script` / `set_reviewers` | Meta |
| `validate_config` / `write_config` | Safety / bulk |
| `get_paths` | Paths + live URL |

### Host config snippets

See `agents/adapters/` for Claude Desktop, Cursor, OpenAI Agents, Hermes, Grok.

---

## Ratings model (do not break)

- **Source of truth: Cloudflare D1** via live `/api/ratings`.
- Browser cache: `localStorage` (`bs-voice-ratings-v1`).
- Key: `voiceId|reviewer`. Categories: `pron`,`prof`,`warm`,`clar`,`emo` (0–5).
- Reviewers: Arman, Denis, Osoba 3. Personal links `?me=`. Blind default on.

---

## Guardrails

- Keep **one shared script** for fair comparison; only change script intentionally for a new round.
- Never put Fish API keys in `config.json` or `index.html`.
- Audio must be **publicly playable** HTTPS (no auth cookie).
- Prefer ≤12 voices so the ranking UI stays usable.
- After editing config: run `validate_config`, then commit both `config.json` and any UI changes.

## Finish check

- [ ] New voice has unique `id`, playable `audio`, title, sex
- [ ] `config.json` validates
- [ ] Live deploy includes new `config.json`
- [ ] Team link still opens; Tab **Stimmen** shows count
