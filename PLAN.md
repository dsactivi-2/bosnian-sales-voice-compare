# Gesamtplan — Empfohlene Kombi-Version (Stand 2026-07-31)

## Nordstern

**Zwei Produktflächen, eine Runtime, dünne Brücken — kein Super-Dashboard.**

| Produkt | Job | Status |
|---|---|---|
| **Voice Compare** | TTS-Stimmen (Library/Clone) hören & human bewerten | Live + D1 + Blind + Personal Links |
| **ops-dashboard** (in DograhV2) | Calls, Transcripts, QA-Scores, Metriken, Optimize | Bereits stark |
| **DograhV2 Runtime** | Workflows, Runs, QA-Node, MCP (Workflow-Bau) | Produktion |

## Was gerade erledigt ist (Stack-Fixes)

1. **50 Samples neu** mit **identischem Sales-Skript** (bs/hr/sr)
2. **Persönliche Links** `?me=Name` — Name gesperrt
3. **Blind-UI** — Peer-Scores erst nach eigener Bewertung der Stimme
4. **API-Härte**: Reviewer-Allowlist; Wipe nur mit Admin-Key
5. **Doku** an D1 + Realität angepasst
6. **schema.sql** im Repo

## Was absichtlich noch NICHT gebaut ist (großer Plan = Freigabe)

| Phase | Inhalt | Warum warten |
|---|---|---|
| P0+ | Signierte Tokens / echte Auth | Freigabe Architektur |
| P2 | Voice-Lifecycle Queue | Freigabe |
| P3 | Dual-IDs / Revisionen | Freigabe |
| P4–P6 | KI-Follow-ups / Insights | Freigabe |
| P7 | Live-MCP über API | Freigabe |
| Call-Eval in ops-dashboard | Human Review Queue | Separates Produkt |

## Empfohlene Kombi (Priorität)

### A — Jetzt nutzen (Voice Compare)
- Team bewertet über **persönliche Links**
- Filter Ranking nach **bs** für Production-Kandidaten
- Fremdakzente hart aussortieren (Aussprache-Kategorie)
- Shortlist 2–3 Stimmen

### B — Parallel / als Nächstes (ops-dashboard + Dograh)
- QA-Scoreboard & Worst-Runs weiter nutzen
- Human Call-Review **dort**, nicht in Voice Compare
- Dograh QA-Node bleibt Auto-Score

### C — Brücke (dünn)
- Shared `voice_id` / Shortlist aus Compare → Dograh TTS-Slot
- Deep Links zwischen Tools
- **Kein** Merge der UIs

### D — Stimmen-Qualität (nach Shortlist)
- Option B: Clone echter BS-Sales-Person (15–60s clean)
- Re-Render Finalisten mit s2.1-pro + stärkeren Tags
- Tags fixen **nicht** den Akzent

## Was weglassen

- Alles in ein Dashboard mergen
- 50 weitere ungefilterte Library-Stimmen
- KI-Follow-ups bei jeder Sterne-Bewertung
- SalesOps-Legacy parallel ausbauen
- MCP Write ohne Auth

## Nächster Schritt nach Freigabe

Explizit freigeben: **A** (nur Voice Compare P0 Auth+Tokens) · **B** (ops Human-Call-Review) · **C** (Brücke voice_id) · oder **Kombi A+C**.

Erst nach Freigabe wird der große Plan implementiert.
