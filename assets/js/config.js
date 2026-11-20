/*
 * Konfiguration der Status-Page.
 * Passe diese Datei an, nach einem Fork musst du nichts anderes ändern.
 */
window.STATUS_CONFIG = {
  // Titel und Untertitel im Seitenkopf
  title: "Minecraft Status",
  subtitle: "Live-Status unserer Server",

  // Server, die angezeigt werden.
  //   name:    Anzeigename
  //   address: Adresse, optional mit Port (z. B. "play.example.net:25566")
  //   type:    "java" (Standard) oder "bedrock"
  servers: [
    { name: "Hypixel", address: "mc.hypixel.net", type: "java" },
    { name: "Mineplex", address: "us.mineplex.com", type: "java" },
    { name: "The Hive (Bedrock)", address: "geo.hivebedrock.network", type: "bedrock" }
  ],

  // Verfügbare Designs. "id" entspricht assets/css/themes/<id>.css
  themes: [
    { id: "modern",  label: "Modern",  swatch: ["#0f1115", "#5b8cff"] },
    { id: "classic", label: "Classic", swatch: ["#8b5a2b", "#55a630"] },
    { id: "neon",    label: "Neon",    swatch: ["#0a0420", "#ff2fd1"] },
    { id: "light",   label: "Light",   swatch: ["#f5f7fb", "#2563eb"] },
    { id: "nether",  label: "Nether",  swatch: ["#2a0b0b", "#ff6a2b"] }
  ],
  defaultTheme: "modern",

  // Automatische Aktualisierung in Sekunden (mindestens 30, die API cached ca. 1 Minute)
  refreshSeconds: 60,

  // Maximale Anzahl angezeigter Spielernamen pro Server
  maxPlayerNames: 12,

  // true = Beispieldaten statt echter Abfragen (zum Ausprobieren der Designs).
  // Zusätzlich lässt sich der Demo-Modus mit ?demo=1 in der URL aktivieren.
  demo: false
};
