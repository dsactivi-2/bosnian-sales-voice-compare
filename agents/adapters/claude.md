# Claude (Desktop / Claude Code / Claude API with MCP)

## Skill

Copy or symlink this skill so Claude can load it:

```text
# Claude Code project skill
.claude/skills/voice-compare/SKILL.md  ← copy from agents/SKILL.md

# or user-level
~/.claude/skills/voice-compare/SKILL.md
```

Also keep `config.json` in the same repo Claude is working in.

## MCP (claude_desktop_config.json)

```json
{
  "mcpServers": {
    "voice-compare": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/to/bosnian-sales-voice-compare/mcp/server.mjs"],
      "env": {
        "VOICE_COMPARE_ROOT": "/ABSOLUTE/PATH/to/bosnian-sales-voice-compare"
      }
    }
  }
}
```

Claude Code (`~/.claude.json` or project `.mcp.json`):

```json
{
  "mcpServers": {
    "voice-compare": {
      "command": "node",
      "args": ["./mcp/server.mjs"],
      "env": { "VOICE_COMPARE_ROOT": "." }
    }
  }
}
```

## Typical prompt

> Add this Fish voice to our compare dashboard: id=…, title=…, sex=f, audio=https://…mp3. Keep the existing script. Validate config.
