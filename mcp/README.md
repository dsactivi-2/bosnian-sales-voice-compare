# voice-compare MCP

Zero-dependency **Model Context Protocol** server for the Bosnian sales voice compare catalog.

```bash
node server.mjs
```

Env:

| Var | Meaning |
|---|---|
| `VOICE_COMPARE_ROOT` | Directory containing `config.json` (default: parent of `mcp/`) |
| `VOICE_COMPARE_CONFIG` | Explicit path to config file |

## Tools

`get_config`, `list_voices`, `add_voice`, `update_voice`, `remove_voice`, `set_script`, `set_reviewers`, `validate_config`, `write_config`, `get_paths`

## Wire-up

See `../agents/adapters/` for Claude, Grok, OpenAI, Hermes.
