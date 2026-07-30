# Grok (Grok Build / xAI agent skills)

## Skill

This repo skill is compatible with Grok skill layout:

```text
.grok/skills/voice-compare/SKILL.md   ← copy agents/SKILL.md
```

Or in this monorepo workspace, agents already have the skill under the GitHub project after clone.

## MCP

If the Grok / Cursor host supports MCP stdio:

```json
{
  "mcpServers": {
    "voice-compare": {
      "command": "node",
      "args": ["mcp/server.mjs"],
      "env": { "VOICE_COMPARE_ROOT": "." }
    }
  }
}
```

## Without MCP

1. Read `config.json`
2. Append / edit `voices[]`
3. Keep schema fields (`id`, `title`, `sex`, `audio`)
4. Commit + redeploy static host / Cloudflare worker that serves `config.json`

## Connected Fish tools

Use Fish Audio skill + connected tools for TTS, then MCP `add_voice` or direct JSON edit.
