# Bosnian Sales Voice Compare

Human A/B rating of Fish Audio (s2.x) voices for tele-sales / call-center / voice agents.

**Live:** https://voice-compare.activi.io/

## Rate (personal links)

- [Denis](https://voice-compare.activi.io/?me=Denis)
- [Arman](https://voice-compare.activi.io/?me=Arman)
- [Osoba 3](https://voice-compare.activi.io/?me=Osoba%203)

Blind mode is on by default: peer scores appear only after you rate a voice.

## Portfolio v2 (2026-07-31)

| Group | Count |
|---|---|
| Bosnian / BA (bs) | 10♂ + 10♀ |
| Croatian (hr) | 5♂ + 5♀ |
| Serbian (sr) | 5♂ + 5♀ |
| English (en) | 5 |
| Multilingual (ml) | 5 |
| Agent profiles | 6 (instruction packs on library bases) |

- Uniform **stress-test sample** audio (names Ana/Marko, numbers, time, email)
- Full long script in UI for evaluation reading
- Tags + **voice_instructions** per voice for agent systems
- Ratings in Cloudflare D1

## Stack

- Static UI (`index.html` + `config.json`) pinned from GitHub via Cloudflare Worker
- Ratings in Cloudflare D1 (`PRIMARY KEY(voice_id, reviewer)`)

## API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | commit + feature flags |
| GET/PUT/DELETE | `/api/ratings` | allowlisted reviewers only |
| DELETE | `/api/ratings?all=1` | requires `x-admin-key` |

See [PLAN.md](./PLAN.md) for architecture combo (Voice Compare ≠ ops-dashboard).
