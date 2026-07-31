# v7.3.0 — Auto-Phonetik

- Worker: expected TTS-Text → Fish STT (ASR) → Diff-Score
- D1 `phonetic_results`
- API: GET `/api/phonetic`, POST `/api/phonetic/run`, POST `/api/phonetic/ingest`, DELETE
- UI-Tab **Auto-Phonetik** (nur Main)
- Live-STT braucht Worker-Secret `FISH_API_KEY`; ohne Key: Ingest mit vorberechnetem Transcript
- Pin: `COMMIT=7b2fc2a` · health `appVersion: 7.3.0` · feature `auto-phonetik`

## Smoke (2026-07-31)

- Health + UI 7.3.0 + Tab Auto-Phonetik ✓
- Ingest STT flash → Diff score 63 auf Clone TS 01 ✓
- Live `/api/phonetic/run` → 503 bis `FISH_API_KEY` gesetzt
- v7.2 Features (Users/Archive/Audit/Ratings) unverändert ✓
