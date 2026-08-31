# ArcadeVerse

Eine fertige, statische 3D-Mini-Game-Webseite als GitHub-Pages-Projekt.

## Enthalten

- 3D animierter Hintergrund mit Three.js
- 5 Minispiele:
  - Target Rush
  - Coin Collector
  - Dodge Cube
  - Reaction Test
  - Neon Runner
- Highscores
- Coins & XP
- Level-System
- lokales Speichern mit `localStorage`
- Daily Challenges
- Season Battle Pass
- Cosmetic Shop
- Skins, Hüte, Trails und Effects
- Profil / Leaderboard
- Responsive Design für Desktop und Mobile
- komplett ohne Build-Step

## Start lokal

Ein einfacher statischer Server reicht:

```bash
python -m http.server 8080
```

Dann `http://localhost:8080` öffnen.

Alternativ mit VS Code die Datei mit Live Server starten.

## GitHub Pages

1. Neues GitHub-Repository erstellen.
2. Alle Dateien aus diesem Ordner hochladen.
3. In GitHub unter **Settings → Pages**:
   - Source: **Deploy from a branch**
   - Branch: `main`
   - Folder: `/ (root)`
4. Speichern.

Die Seite wird anschließend als GitHub-Pages-Webseite veröffentlicht.

## Hinweis zur Speicherung

Der aktuelle Fortschritt wird lokal im Browser gespeichert. Das bedeutet:

- kein Login nötig
- kein Backend nötig
- GitHub Pages reicht aus
- Fortschritt ist geräte-/browserabhängig

Für echte globale Online-Highscores, Accounts, Cloud-Saves und serverseitig sichere Coins braucht das Projekt später ein Backend bzw. eine Datenbank.

## Tech

- HTML
- CSS
- Vanilla JavaScript
- Three.js via CDN
- localStorage

## Struktur

```text
arcadeverse/
├── index.html
├── styles.css
├── app.js
├── assets/
└── README.md
```
