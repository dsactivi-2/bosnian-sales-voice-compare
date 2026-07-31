# v7.3.0 — Auto-Phonetik

- Worker: TTS expected text → Fish STT (ASR) → Diff score
- D1 `phonetic_results`
- API: GET `/api/phonetic`, POST `/api/phonetic/run`, POST `/api/phonetic/ingest`, DELETE
- UI tab **Auto-Phonetik** (Main only)
- Requires Worker secret `FISH_API_KEY` for live STT; ingest allows precomputed transcripts
