# bosnian-sales-voice-compare

Team-Dashboard: 8 Fish-Audio Stimmen (bosnisch) für Telefonsales vergleichen und bewerten.

## Live-Link (Team)

**https://voice-compare.activi.io/**

## Repo-Inhalt

| Datei | Beschreibung |
|-------|----------------|
| `index.html` | Komplettes Dashboard (Bewerten + Ranking) |
| `README.md` | Diese Anleitung |

Keine Dependencies, kein Build — eine HTML-Datei.

## Features

- 8 Voice-Samples (gleicher Sales-Opener)
- **Bewerten:** 5 Kategorien, 0–5 Sterne, Kommentar
- Reviewer: Arman / Denis / Osoba 3
- **Ranking:** Team-Ø, Filter (Mindest-Ø, Geschlecht, Multi-Select)
- Speicherung: Browser `localStorage` (pro Gerät)
- Team-Sync: **Export** / **Import** (JSON)

## Lokal

```bash
# Datei im Browser öffnen
open index.html
# oder
python3 -m http.server 8080
```

## Nutzung

1. Link öffnen → eigenen Namen wählen  
2. Stimmen anhören → Sterne setzen → **Bewertung speichern**  
3. Tab **Ranking** für Übersicht  
4. Meeting: **Export** → teilen → jemand **Import** für gemeinsames Ranking  

## TTS-Skript

```
[friendly][confident] Dobar dan! Zovem se Ana iz Acme. [pause]
Imate li minut da vam pokažem kako možete uštedjeti do
[emphasis] trideset posto [emphasis] na mjesečnim troškovima?
```
