# Minecraft-Status

Eine Status-Page für Minecraft-Server, die du forken und mit deinen eigenen Servern befüllen kannst. Sie besteht nur aus statischen Dateien und läuft direkt auf GitHub Pages, ohne Build-Schritt und ohne Abhängigkeiten.

## Features

- Live-Status für beliebig viele Server (Java und Bedrock) über die API von [mcsrvstat.us](https://mcsrvstat.us)
- Spielerzahl, Auslastungsbalken, Version, Antwortzeit, MOTD und Server-Icon
- **5 Designs zum Umschalten:** Modern, Classic, Neon, Light und Nether
- Die Wahl wird im Browser gespeichert und lässt sich per Link teilen, z. B. `?theme=neon`
- Automatische Aktualisierung und Zusammenfassung ("Alle Systeme laufen", "Teilweise Störung" usw.)
- Demo-Modus mit Beispieldaten, um die Designs ohne echte Server auszuprobieren: `?demo=1`
- Responsive und mit Tastatur bedienbar

## Schnellstart

1. Repository forken.
2. In `assets/js/config.js` deine Server eintragen:

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

## Designs

| Design  | Look                                         |
| ------- | -------------------------------------------- |
| Modern  | Dunkel, Glas-Optik, weiche Ecken             |
| Classic | Minecraft-GUI mit Erde, Gras und eckigen Rahmen |
| Neon    | Cyberpunk mit leuchtenden Rändern            |
| Light   | Hell und minimalistisch                      |
| Nether  | Netherrack, Lava und Glut                    |

Welches Design beim ersten Besuch aktiv ist, steuert `defaultTheme` in der Konfiguration.

### Eigenes Design hinzufügen

1. `assets/css/themes/modern.css` kopieren, z. B. nach `assets/css/themes/ocean.css`.
2. Den Selektor auf `:root[data-theme="ocean"]` ändern und die Variablen anpassen.
3. Die Datei in `index.html` per `<link>` einbinden.
4. In `assets/js/config.js` unter `themes` einen Eintrag ergänzen:

   ```js
   { id: "ocean", label: "Ocean", swatch: ["#04202e", "#18c1d8"] }
   ```

## Projektstruktur

```
index.html
assets/
  css/
    base.css          Layout, nutzt nur CSS-Variablen
    themes/           ein Stylesheet pro Design
  js/
    config.js         Server, Designs, Intervall
    app.js            Abfrage, Rendering, Design-Umschalter
```

## Hinweise

- Die API cached Antworten etwa eine Minute, ein kürzeres Aktualisierungsintervall als 30 Sekunden bringt nichts und wird deshalb ignoriert.
- Server, die Anfragen blockieren oder Query/Ping abschalten, werden als offline oder unbekannt angezeigt.

## Lizenz

[MPL 2.0](LICENSE)
