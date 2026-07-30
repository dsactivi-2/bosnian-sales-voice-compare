# bosnian-sales-voice-compare

Team-Dashboard: Fish-Audio-Stimmen (bosnisch) für Telefonsales vergleichen & bewerten.

## Live

**https://voice-compare.activi.io/**

## Stimmen ändern (einfach)

### Option 1 — `config.json` (empfohlen fürs Team)

Datei `config.json` → Array `voices[]` erweitern:

```json
{
  "id": "fish-voice-id-or-slug",
  "title": "Anzeigename",
  "sex": "m",
  "note": "Kurz warum diese Stimme",
  "tags": ["confident", "sales"],
  "audio": "https://…/sample.mp3"
}
```

Commit + Deploy → alle sehen die neuen Stimmen.

### Option 2 — UI-Tab **Stimmen**

1. Dashboard öffnen → Tab **Stimmen**  
2. Formular ausfüllen → speichert **Browser-Entwurf**  
3. **Config exportieren** → Datei als `config.json` ins Repo  
4. Deploy  

### Option 3 — Agent / MCP

```bash
node mcp/server.mjs
```

Tools: `add_voice`, `update_voice`, `list_voices`, …  
Skill: [`agents/SKILL.md`](agents/SKILL.md) (Claude · Grok · OpenAI · Hermes)

## Dateien

| Pfad | Zweck |
|---|---|
| `config.json` | **Single source of truth** (Stimmen, Skript, Reviewer) |
| `index.html` | UI (lädt config.json) |
| `schema.json` | JSON Schema |
| `agents/SKILL.md` | Einheitlicher Agent-Skill |
| `agents/adapters/*` | Claude / Grok / OpenAI / Hermes Wiring |
| `mcp/server.mjs` | MCP-Server (stdio, ohne Dependencies) |

## Bewertungen

- Liegen im **Browser** (`localStorage`), nicht in `config.json`
- Button **Bewertung speichern** ist Pflicht
- Team-Sync: Export / Import JSON

## Lokal

```bash
cd /path/to/repo
python3 -m http.server 8080
# → http://127.0.0.1:8080/
```

## TTS-Skript (fair für alle Stimmen)

Steht in `config.json` → `script`.
