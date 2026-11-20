/*
 * ============================================================
 *  Konfiguration der Status-Page
 * ============================================================
 *  Alles, was du anpassen kannst, liegt im Ordner config/:
 *
 *    config/config.js    diese Datei (Texte, Server, Design-Einstellungen)
 *    config/themes/      ein Stylesheet pro Design (eigene Designs einfach dazulegen)
 *    config/assets/      Logo, Favicon, Hintergrundbild und eigene Server-Icons
 *
 *  Nach einem Fork musst du außerhalb von config/ nichts ändern.
 *  Alle Pfade sind relativ zur index.html.
 */
window.STATUS_CONFIG = {

  /* ---------- Texte ---------- */

  title: "Minecraft Status",
  subtitle: "Live-Status unserer Server",
  footerText: "",            // optionaler Zusatztext im Footer

  // Links oben im Header (z. B. Discord, Website). Leer lassen für keine Links.
  links: [
    // { label: "Discord", url: "https://discord.gg/dein-invite" },
    // { label: "Website", url: "https://example.net" }
  ],

  /* ---------- Bilder (liegen in config/assets/) ---------- */

  logo: "config/assets/logo.svg",         // null = farbiges Quadrat aus dem Design
  favicon: "config/assets/favicon.svg",   // null = Standard-Icon
  background: null,                       // z. B. "config/assets/background.jpg"

  /* ---------- Design ---------- */

  // Aktives Design. Bei allowThemeSwitch: false ist das für ALLE Besucher fest.
  // Bei allowThemeSwitch: true ist es das Design für den ersten Besuch.
  theme: "modern",

  // true  = Besucher sehen einen Umschalter und dürfen ein Design wählen
  //         (ihre Wahl wird im Browser gespeichert, auch per ?theme=neon teilbar)
  // false = Kein Umschalter, es wird immer nur das Design aus "theme" angezeigt
  allowThemeSwitch: true,

  // Designs, die zur Auswahl stehen. "id" entspricht config/themes/<id>.css
  // Wenn du nur einige zeigen willst, lösche die anderen Einträge hier.
  themes: [
    { id: "modern",  label: "Modern",  swatch: ["#0f1115", "#5b8cff"] },
    { id: "classic", label: "Classic", swatch: ["#8b5a2b", "#55a630"] },
    { id: "neon",    label: "Neon",    swatch: ["#0a0420", "#ff2fd1"] },
    { id: "light",   label: "Light",   swatch: ["#f5f7fb", "#2563eb"] },
    { id: "nether",  label: "Nether",  swatch: ["#2a0b0b", "#ff6a2b"] }
  ],

  /* ---------- Server ---------- */

  //   name:    Anzeigename
  //   address: Adresse, optional mit Port (z. B. "play.example.net:25566")
  //   type:    "java" (Standard) oder "bedrock"
  //   icon:    optional, eigenes Icon, z. B. "config/assets/survival.png"
  //            (sonst wird das Server-Icon verwendet, falls vorhanden)
  servers: [
    { name: "Hypixel", address: "mc.hypixel.net", type: "java" },
    { name: "Mineplex", address: "us.mineplex.com", type: "java" },
    { name: "The Hive (Bedrock)", address: "geo.hivebedrock.network", type: "bedrock" }
  ],

  /* ---------- Verhalten ---------- */

  // Welche Status-API abgefragt wird:
  //   "auto"      = mcstatus.io und mcsrvstat.us, meldet einer "online", gilt der Server als online
  //                 (empfohlen, manche Server wie Hypixel blockieren einzelne Dienste)
  //   "mcstatus"  = nur mcstatus.io
  //   "mcsrvstat" = nur mcsrvstat.us
  provider: "auto",

  // Automatische Aktualisierung in Sekunden (mindestens 30, die APIs cachen ca. 1 Minute)
  refreshSeconds: 60,

  // Maximale Anzahl angezeigter Spielernamen pro Server
  maxPlayerNames: 12,

  // Spielerköpfe vor den Namen anzeigen. Lädt Bilder von mc-heads.net,
  // dabei werden die Spielernamen an diesen Dienst übertragen.
  playerHeads: false,

  // true = Beispieldaten statt echter Abfragen (zum Ausprobieren der Designs).
  // Zusätzlich lässt sich der Demo-Modus mit ?demo=1 in der URL aktivieren.
  demo: false
};
