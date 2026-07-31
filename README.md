# Bosnian Sales Voice Compare

Human A/B rating of Fish Audio (s2.x) voices for Bosnian tele-sales.

**Live:** https://voice-compare.activi.io/

## Rate (personal links)

- [Denis](https://voice-compare.activi.io/?me=Denis)
- [Arman](https://voice-compare.activi.io/?me=Arman)
- [Osoba 3](https://voice-compare.activi.io/?me=Osoba%203)

Blind mode is on by default: peer scores appear only after you rate a voice.

## Stack

- Static UI (`index.html` + `config.json`) pinned from GitHub via Cloudflare Worker
- Ratings in Cloudflare D1 (`PRIMARY KEY(voice_id, reviewer)`)
- 50 voices · languages bs / hr / sr · uniform sales-script sample batch `2026-07-31`

## API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | commit + feature flags |
| GET/PUT/DELETE | `/api/ratings` | allowlisted reviewers only |
| DELETE | `/api/ratings?all=1` | requires `x-admin-key` |

See [PLAN.md](./PLAN.md) for the recommended architecture combo (Voice Compare ≠ ops-dashboard).
