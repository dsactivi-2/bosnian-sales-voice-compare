# Bosnian Sales Voice Compare

Live: https://voice-compare.activi.io/

## Portfolio v4 (2026-07-31)

**56 curated voices** for professional tele-sales / call-center / voice-agent evaluation.

| Group | Count |
|-------|------:|
| Bosnian (BS/BA) male | 10 |
| Bosnian (BS/BA) female | 10 |
| Croatian (HR) male | 5 |
| Croatian (HR) female | 5 |
| Serbian (SR) male | 5 |
| Serbian (SR) female | 5 |
| English (neutral) | 5 |
| Multilingual | 5 |
| Agent instruction profiles | 6 |

### Evaluation script
Long stress script (UI): names **Ana Hadžić** / **Marko Petrović** with pronouns, dates, times, reference numbers, percentages, KM/EUR, emails, URLs, objections, appointment choice, emotions.

Audio samples use a short free-plan TTS stress line (≤500 bytes).

### Exclusions
Politicians, character gags, vulgar titles, ASMR/intimate, gaming announcers.

### Agent profiles
Not real clones (consent required for cloning). Six instruction-optimized profiles share library base audio with separate rating IDs.

### Team
Reviewers: Arman, Denis, Osoba 3. Ratings in Cloudflare D1.

### Repo files
- `config.json` — source of truth
- `index.html` — UI + embedded fallback config
- `deploy/cloudflare-worker.js` — CDN pin via `COMMIT`
