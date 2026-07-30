# OpenAI (ChatGPT Desktop / Agents SDK / Codex)

## Skill / instructions

- Project instruction file: copy summary into `AGENTS.md` (see root `AGENTS.md` fragment below) **or**
- Load `agents/SKILL.md` as a tool skill in your agent definition.

### AGENTS.md fragment

```markdown
## Voice Compare
- Catalog: config.json (voices, script, reviewers)
- Ratings: browser localStorage only (not server)
- Add voice: MCP voice-compare add_voice OR edit config.json voices[]
- Live: https://voice-compare.activi.io/
```

## MCP (ChatGPT Developer Mode / Agents)

```json
{
  "mcpServers": {
    "voice-compare": {
      "command": "node",
      "args": ["mcp/server.mjs"],
      "cwd": "/ABSOLUTE/PATH/to/bosnian-sales-voice-compare",
      "env": {
        "VOICE_COMPARE_ROOT": "/ABSOLUTE/PATH/to/bosnian-sales-voice-compare"
      }
    }
  }
}
```

## Agents SDK (Node)

Spawn the same command as an MCP server transport; tools appear as `add_voice`, `list_voices`, etc.

## Typical tool sequence

1. `list_voices` — see catalog  
2. Generate audio externally (Fish)  
3. `add_voice`  
4. `validate_config`  
5. Commit `config.json` + deploy  
