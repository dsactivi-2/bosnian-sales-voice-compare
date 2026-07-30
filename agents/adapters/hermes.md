# Hermes (agent runtimes using skill packs + MCP)

## Skill pack

Hermes-compatible skill document is the same universal file:

```text
skills/voice-compare/SKILL.md  ← agents/SKILL.md
```

Frontmatter fields used:

- `name: voice-compare`
- `description: ...`
- `metadata.platforms` includes `hermes`

## MCP registration

```yaml
# example hermes mcp config
mcp:
  voice-compare:
    command: node
    args: ["mcp/server.mjs"]
    env:
      VOICE_COMPARE_ROOT: ${WORKSPACE}
```

## Tool policy

| Intent | Tool |
|---|---|
| Show catalog | `list_voices` |
| Add candidate | `add_voice` |
| Replace sample | `update_voice` |
| Fair script change | `set_script` (warn team) |
| Sanity | `validate_config` |

## Notes

- No API keys in config.
- Deploy is outside MCP — after write, Hermes should commit/push or call your deploy step.
