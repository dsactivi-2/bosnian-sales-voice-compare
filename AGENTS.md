# AGENTS.md — Voice Compare

## Project

Static team tool to compare Bosnian tele-sales TTS voices and rate them.

- **Live:** https://voice-compare.activi.io/
- **Truth:** `config.json` (voices, script, reviewers, categories)
- **UI:** `index.html` (loads config; ratings in browser localStorage only)
- **Skill:** `agents/SKILL.md`
- **MCP:** `node mcp/server.mjs` (zero deps)

## Do this when user asks to change voices

1. Prefer MCP `add_voice` / `update_voice` or edit `config.json` `voices[]`
2. Required fields: `id`, `title`, `sex` (`m`|`f`|`x`), `audio` (public mp3 URL)
3. Keep shared `script` unless user wants a new comparison round
4. `validate_config` then commit + deploy static assets
5. Never put API keys in config or HTML

## Do not

- Hardcode new voices only inside JS of `index.html` (use config)
- Claim ratings are shared server-side (they are localStorage + export/import)
- Change voice `id` casually (breaks rating history for that voice)
