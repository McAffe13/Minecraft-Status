# Minecraft-Status

[English](README.md)

Eine Status-Page für Minecraft-Server, die du forken und mit deinen eigenen Servern befüllen kannst. Sie besteht nur aus statischen Dateien und läuft direkt auf GitHub Pages, ohne Build-Schritt und ohne Abhängigkeiten.

## Features

- Live-Status für beliebig viele Server (Java und Bedrock) über [mcstatus.io](https://mcstatus.io) und [mcsrvstat.us](https://mcsrvstat.us). Meldet einer der beiden "online", gilt der Server als online, so fallen auch Server wie Hypixel nicht fälschlich durch, die einzelne Dienste blockieren
- Spielerzahl mit Auslastungsbalken, Version, MOTD, Server-Icon und Spielerliste
- Zusammenfassung ("Alle Systeme laufen", "Teilweise Störung" usw.) mit Gesamtzahl der Spieler, Zeit der letzten Aktualisierung und Countdown bis zur nächsten
- **10 Sprachen:** English, Deutsch, Español, Français, Italiano, Português, Nederlands, Polski, Türkçe und Русский, mit je Sprache formatierten Zahlen, Prozentwerten und Zeiten
- **5 Designs:** Modern, Classic, Neon, Light und Nether
- Design und Sprache fest vorgeben **oder** Besuchern die Auswahl per Menü erlauben
- Alles Anpassbare liegt im Ordner [`config/`](config/), einschließlich Logo, Favicon und Hintergrundbild
- Demo-Modus mit Beispieldaten (`?demo=1`) zum Ausprobieren
- Responsive, mit Tastatur bedienbar, respektiert `prefers-reduced-motion`

## Schnellstart

1. Repository forken.
2. `config/config.js` öffnen und deine Server eintragen:

   ```js
   servers: [
     { name: "Survival", address: "play.example.net" },
     { name: "Bedrock", address: "bedrock.example.net:19132", type: "bedrock" }
   ]
   ```

3. In den Repository-Einstellungen unter **Pages** die Veröffentlichung aktivieren (Branch oder GitHub Actions).
4. Fertig, die Seite ist unter `https://<dein-name>.github.io/<repo>/` erreichbar.

Lokal testen geht mit einem beliebigen statischen Server, zum Beispiel:

```bash
python3 -m http.server 8000
```

Dann `http://localhost:8000/?demo=1` öffnen.

## Der config-Ordner

```
config/
  config.js        Texte, Server, Design- und Spracheinstellungen, Verhalten
  themes/          ein Stylesheet pro Design
  languages/       eine Datei pro Sprache
  assets/          Logo, Favicon, Hintergrundbild, eigene Server-Icons
```

Außerhalb von `config/` musst du nichts ändern. Der Code liegt in `index.html` und `assets/`.

### Sprache

```js
language: "en",              // Standardsprache
autoDetectLanguage: false,   // true = beim ersten Besuch die Browsersprache verwenden
allowLanguageSwitch: true,   // true = Sprachmenü, false = immer "language"
languages: [ { code: "en", label: "English" }, { code: "de", label: "Deutsch" } /* … */ ]
```

| `allowLanguageSwitch` | Verhalten |
| --------------------- | --------- |
| `true`  | Es erscheint ein Sprachmenü. Die Wahl wird im Browser gespeichert und lässt sich per Link teilen (`?lang=de`). |
| `false` | Kein Menü. Alle Besucher sehen immer `language`, `?lang=` wird ignoriert. |

Mit `autoDetectLanguage: true` wird beim ersten Besuch die Browsersprache verwendet, sofern sie in `languages` steht (z. B. passt `pt-BR` auf `pt`). Sonst gilt `language`. Fehlende Übersetzungen fallen immer auf Englisch zurück.

Texte in der Konfiguration (`title`, `subtitle`, `footerText`, Link-Beschriftungen und `description` bei Servern) können ein einfacher String oder ein Objekt mit einem Text pro Sprache sein:

```js
title: { en: "Our servers", de: "Unsere Server" }
```

#### Sprache hinzufügen

1. `config/languages/en.js` nach `config/languages/<code>.js` kopieren (z. B. `sv.js`).
2. Die Werte übersetzen. Schlüssel und `{Platzhalter}` bleiben unverändert, und `en` in `window.STATUS_LANGS.en` wird durch deinen Code ersetzt. Für Sprachen mit Schreibrichtung von rechts nach links `dir: "rtl"` setzen.
3. `{ code: "sv", label: "Svenska" }` in `languages` in `config/config.js` ergänzen.

### Design

```js
theme: "modern",          // aktives Design
allowThemeSwitch: true,   // true = Besucher dürfen wählen, false = festes Design
```

| `allowThemeSwitch` | Verhalten |
| ------------------ | --------- |
| `true`  | Es erscheint ein Umschalter. `theme` ist das Design beim ersten Besuch. Die Wahl wird im Browser gespeichert und lässt sich per Link teilen (`?theme=neon`). |
| `false` | Kein Umschalter. Alle Besucher sehen immer `theme`, `?theme=` wird ignoriert. |

Welche Designs zur Auswahl stehen, steuert die Liste `themes`. Entferne Einträge, die du nicht anbieten möchtest.

| Design  | Look                                            |
| ------- | ----------------------------------------------- |
| Modern  | Dunkel, Glas-Optik, weiche Ecken                |
| Classic | Minecraft-GUI mit Erde, Gras und eckigen Rahmen |
| Neon    | Cyberpunk mit leuchtenden Rändern               |
| Light   | Hell und minimalistisch                         |
| Nether  | Netherrack, Lava und Glut                       |

#### Design hinzufügen

1. `config/themes/modern.css` kopieren, z. B. nach `config/themes/ocean.css`.
2. Den Selektor auf `:root[data-theme="ocean"]` ändern und die Variablen anpassen.
3. In `config/config.js` unter `themes` einen Eintrag ergänzen:

   ```js
   { id: "ocean", label: "Ocean", swatch: ["#04202e", "#18c1d8"] }
   ```

Die Stylesheets werden bei Bedarf geladen, in `index.html` musst du nichts einbinden.

### Logo, Favicon und Hintergrund

Lege deine Dateien in `config/assets/` ab und trage sie in der Konfiguration ein:

```js
logo: "config/assets/logo.svg",
favicon: "config/assets/favicon.svg",
background: "config/assets/background.jpg",   // optional
```

Pro Server lässt sich zusätzlich ein eigenes Icon setzen (`icon: "config/assets/survival.png"`). Ohne Angabe wird das Server-Icon der API verwendet.

### Weitere Optionen

| Option           | Bedeutung |
| ---------------- | --------- |
| `title`, `subtitle`, `footerText` | Texte der Seite (String oder Objekt pro Sprache) |
| `links`          | Links im Header, z. B. Discord oder Website |
| `provider`       | `"auto"` (beide Dienste, Standard), `"mcstatus"` oder `"mcsrvstat"` |
| `refreshSeconds` | Aktualisierungsintervall (mindestens 30) |
| `maxPlayerNames` | Wie viele Spielernamen pro Server angezeigt werden |
| `playerHeads`    | Spielerköpfe anzeigen. Lädt Bilder von mc-heads.net, die Spielernamen werden dabei an diesen Dienst übertragen |
| `demo`           | Beispieldaten statt echter Abfragen |

## Hinweise

- Die APIs cachen Antworten etwa eine Minute, ein kürzeres Aktualisierungsintervall als 30 Sekunden bringt nichts und wird deshalb ignoriert.
- Im Modus `"auto"` wird pro Server und Aktualisierung bei beiden Diensten angefragt. "Unbekannt" erscheint nur, wenn keiner der Dienste erreichbar war.
- Server, die Anfragen von allen Diensten blockieren oder Query/Ping abschalten, werden als offline angezeigt.
- Serverdaten wie MOTD und Spielernamen werden ausschließlich als Text gerendert, nie als HTML.

## Lizenz

[MPL 2.0](LICENSE)
