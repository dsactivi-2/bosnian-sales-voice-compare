# bosnian-sales-voice-compare

Team-Dashboard: **50 Fish-Audio-Stimmen** (bs / hr / sr) für Telefonsales vergleichen & bewerten.

## Live

**https://voice-compare.activi.io/**

## Stimmen

Single source of truth: `config.json` → `voices[]` (50 Einträge).

| Sprache | ca. |
|---|---|
| Bosnisch (bs) | 19 |
| Kroatisch (hr) | 26 |
| Serbisch (sr) | 5 |

Filter im Ranking: Geschlecht + Sprache + Mindest-Ø.

## Bewertungen

Browser `localStorage` · Export/Import für Team-Sync · Reviewer: Arman / Denis / Osoba 3

## Agenten

- Skill: `agents/SKILL.md`
- MCP: `node mcp/server.mjs`


## Cloud-Datenbank (D1)

Bewertungen liegen in **Cloudflare D1** (nicht nur Browser):

- `GET /api/ratings` — alle Team-Bewertungen
- `PUT /api/ratings` — eine Bewertung speichern
- `PUT /api/ratings/bulk` — Import/Merge
- `DELETE /api/ratings?voice_id=&reviewer=` — löschen
- `GET /api/health` — Status

Schema: `deploy/schema.sql`. Worker: `deploy/cloudflare-worker.js` (Binding `DB`).
