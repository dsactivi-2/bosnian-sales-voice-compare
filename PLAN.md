# Gesamtplan — Empfohlene Kombi-Version (Stand 2026-07-31)

## Nordstern

**Zwei Produktflächen, eine Runtime, dünne Brücken — kein Super-Dashboard.**

| Produkt | Job | Status |
|---|---|---|
| **Voice Compare** | TTS-Stimmen (Library/Clone) hören & human bewerten | **Live** · D1 · Blind · Personal Links · Allowlist · Admin-Wipe |
| **ops-dashboard** (in DograhV2) | Calls, Transcripts, QA-Scores, Metriken, Optimize | Bereits stark |
| **DograhV2 Runtime** | Workflows, Runs, QA-Node, MCP (Workflow-Bau) | Produktion |

**Trennlinie:** Voice Compare = *Stimmen-Schönheitswettbewerb / Shortlist*.  
ops-dashboard = *Call-Qualität & Agent-Verhalten*. Nicht mergen.

---

## Was live ist (aktueller Stack, 2026-07-31)

| Fix | Status |
|---|---|
| 50 Samples **identisches Sales-Skript** (bs 19 / hr 26 / sr 5), Batch `2026-07-31` | ✅ |
| STT-Stichprobe: alle 9 gehörten Stimmen sprechen Opening „Dobar dan… Ana iz Acme… 30%…“ | ✅ |
| Persönliche Links `?me=Denis` / `?me=Arman` / `?me=Osoba%203` | ✅ |
| Blind-UI: Peer-Scores erst nach eigener Bewertung | ✅ |
| Reviewer-Allowlist (API) | ✅ |
| Full-Wipe nur mit `x-admin-key` | ✅ |
| GitHub pin `COMMIT=f08c21d` + Worker redeploy | ✅ |
| D1 Ratings `PRIMARY KEY(voice_id, reviewer)` | ✅ |

> **Hinweis:** Beim Absichern des Wipe-Endpoints wurden bestehende Demo-Ratings geleert. Team muss **neu bewerten**.

### Abhören (STT flash, Stichprobe)

| Lang | Stimme (Beispiel) | STT-Inhalt (sinngemäß) |
|---|---|---|
| bs | Samouvjeren / Prof. Muški / Autoritet | Sales-Opening, Acme, 30 % Ersparnis |
| hr | Hrvatska Govornica / Muški / Ugodan | dasselbe Skript |
| sr | Srpski muški / Duboki / Snažan | dasselbe Skript (eine Stimme mit mehr Artefakten) |

Library-Metadaten (`languages[]`) bleiben unzuverlässig — **Ohr + Kategorie Aussprache** entscheiden, nicht Tags.

---

## Empfohlene Kombi (Priorität)

### A — Jetzt (Voice Compare) ← **aktiver Fokus**

1. Team bewertet über **persönliche Links** (Blind an).
2. Filter Ranking **bs zuerst** (Produktion BiH), hr/sr als Vergleich.
3. Fremdakzente hart aussortieren (Aussprache-Sterne).
4. Shortlist **2–3 Stimmen**.
5. Optional: Finalisten mit s2.1-pro + stärkeren Tags re-rendern.

### B — Parallel (ops-dashboard + Dograh) — **nicht in Voice Compare bauen**

1. QA-Scoreboard & Worst-Runs weiter nutzen.
2. Human Call-Review **dort** (Transcript + Score + Note).
3. Dograh QA-Node bleibt Auto-Score (DeepEval/Ragas/Promptfoo wo schon verdrahtet).

### C — Dünne Brücke (nach Shortlist)

1. Shared `voice_id` / Shortlist-JSON aus Compare → Dograh TTS-Slot.
2. Deep Links Compare ↔ ops-dashboard (Run/Voice).
3. **Kein** UI-Merge, **kein** gemeinsames Mega-Schema.

### D — Stimmen-Qualität (nach Shortlist)

1. **Option B:** Clone echter BS-Sales-Person (15–60 s clean).
2. Re-Render Finalisten s2.1-pro.
3. Tags/Emotion-Bracket **fixen nicht** den Akzent — nur Delivery.

---

## Großer Plan — nur nach **expliziter Freigabe**

| Phase | Inhalt | Abhängigkeit |
|---|---|---|
| **P0** | Signierte Reviewer-Tokens / echte Auth (statt `?me=` + Allowlist) | Freigabe A |
| **P1** | Export-Filter + Shortlist-Lifecycle (candidate → shortlist → prod) | Freigabe A |
| **P2** | Dual-IDs / Sample-Revisionen (voice_id + sample_sha) | Freigabe A |
| **P3** | Selective KI-Follow-ups nur bei Low-Score / Diskrepanz | Freigabe A |
| **P4** | Live-MCP read-only über API (Rankings, Shortlist) | Freigabe A+C |
| **P5** | ops-dashboard Human Call-Review Queue | Freigabe B |
| **P6** | Brücke voice_id → Dograh TTS config | Freigabe C |

### Freigabe-Codes (bitte genau so antworten)

- **`FREIGABE A`** — nur Voice Compare P0–P3  
- **`FREIGABE B`** — ops Human-Call-Review  
- **`FREIGABE C`** — Brücke voice_id  
- **`FREIGABE KOMBI A+C`** — empfohlen nach Shortlist  
- **`FREIGABE ALL`** — alles sequentiell  

**Ohne einen dieser Codes wird der große Plan nicht gebaut.**

---

## Was wir bewusst weglassen

- Alles in ein Dashboard mergen  
- 50 weitere ungefilterte Library-Stimmen  
- KI-Follow-up bei jeder Sterne-Bewertung  
- SalesOps-Legacy parallel ausbauen  
- MCP Write ohne Auth  
- Voice Compare als Call-QA missbrauchen  

---

## Ops-Cheat-Sheet

| Item | Wert |
|---|---|
| Live | https://voice-compare.activi.io/ |
| Health | `/api/health` → `commit: f08c21d`, features inkl. blind/allowlist |
| Repo | https://github.com/dsactivi-2/bosnian-sales-voice-compare |
| Reviewer | Arman · Denis · Osoba 3 |
| Admin-Wipe | `DELETE /api/ratings?all=1` + Header `x-admin-key: vc-admin-2026` |
| D1 | `voice-compare` / binding `DB` |

### Persönliche Bewertungs-Links

- Denis: https://voice-compare.activi.io/?me=Denis  
- Arman: https://voice-compare.activi.io/?me=Arman  
- Osoba 3: https://voice-compare.activi.io/?me=Osoba%203  

---

## Nächster menschlicher Schritt

1. **Jetzt bewerten** (Links oben), bs-Filter, Shortlist.  
2. Plan lesen → bei Bedarf **`FREIGABE …`** schicken.  
3. Erst dann großer Plan.
