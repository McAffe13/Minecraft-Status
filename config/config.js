/*
 * ============================================================
 *  Status page configuration
 * ============================================================
 *  Everything you can customize lives in the config/ folder:
 *
 *    config/config.js      this file (texts, servers, theme and language settings)
 *    config/themes/        one stylesheet per theme (drop in your own)
 *    config/languages/     one file per language (drop in your own)
 *    config/assets/        logo, favicon, background image and custom server icons
 *
 *  After forking you do not need to change anything outside config/.
 *  All paths are relative to index.html.
 */
window.STATUS_CONFIG = {

  /* ---------- Texts ---------- */

  // Texts can be a plain string, or an object with one string per language code:
  //   title: { en: "Our servers", de: "Unsere Server" }
  title: "Minecraft Status",
  subtitle: null,            // null = use the translated default ("Live server status")
  footerText: "",            // optional extra line in the footer

  // Links in the header (for example Discord or your website). Leave empty for none.
  links: [
    // { label: "Discord", url: "https://discord.gg/your-invite" },
    // { label: { en: "Website", de: "Webseite" }, url: "https://example.net" }
  ],

  /* ---------- Images (stored in config/assets/) ---------- */

  logo: "config/assets/logo.svg",         // null = coloured square from the theme
  favicon: "config/assets/favicon.svg",   // null = browser default icon
  background: null,                       // for example "config/assets/background.jpg"

  /* ---------- Language ---------- */

  // Default language (a code from the list below).
  language: "en",

  // true  = on the first visit, use the visitor's browser language if it is in the list
  // false = always start with "language" (visitors can still switch if allowed below)
  autoDetectLanguage: false,

  // true  = visitors get a language menu; their choice is remembered in the browser
  //         and can be shared as a link, for example ?lang=de
  // false = no menu, the page is always shown in "language"
  allowLanguageSwitch: true,

  // Languages offered in the menu. "code" matches config/languages/<code>.js.
  // Remove the ones you do not want to offer.
  languages: [
    { code: "en", label: "English" },
    { code: "de", label: "Deutsch" },
    { code: "es", label: "Español" },
    { code: "fr", label: "Français" },
    { code: "it", label: "Italiano" },
    { code: "pt", label: "Português" },
    { code: "nl", label: "Nederlands" },
    { code: "pl", label: "Polski" },
    { code: "tr", label: "Türkçe" },
    { code: "ru", label: "Русский" }
  ],

  /* ---------- Design ---------- */

  // Active theme. With allowThemeSwitch: false this is fixed for ALL visitors.
  // With allowThemeSwitch: true it is the theme shown on the first visit.
  theme: "modern",

  // true  = visitors get a theme switcher; their choice is remembered in the browser
  //         and can be shared as a link, for example ?theme=neon
  // false = no switcher, the theme from "theme" is always used
  allowThemeSwitch: true,

  // Themes offered to visitors. "id" matches config/themes/<id>.css.
  // Remove the ones you do not want to offer.
  themes: [
    { id: "modern",  label: "Modern",  swatch: ["#0f1115", "#5b8cff"] },
    { id: "classic", label: "Classic", swatch: ["#8b5a2b", "#55a630"] },
    { id: "neon",    label: "Neon",    swatch: ["#0a0420", "#ff2fd1"] },
    { id: "light",   label: "Light",   swatch: ["#f5f7fb", "#2563eb"] },
    { id: "nether",  label: "Nether",  swatch: ["#2a0b0b", "#ff6a2b"] }
  ],

  /* ---------- Servers ---------- */

  //   name:        display name
  //   address:     address, optionally with a port (for example "play.example.net:25566")
  //   type:        "java" (default) or "bedrock"
  //   description: optional short text below the name (string or per-language object)
  //   icon:        optional custom icon, for example "config/assets/survival.png"
  //                (otherwise the server's own icon is used, if it has one)
  servers: [
    { name: "Hypixel", address: "mc.hypixel.net", type: "java" },
    { name: "The Hive (Bedrock)", address: "geo.hivebedrock.network", type: "bedrock" },
    { name: "McAffen", address: "play.mcaffen.de", type: "java" }
  ],

  /* ---------- Behaviour ---------- */

  // Which status API is queried:
  //   "auto"      = mcstatus.io and mcsrvstat.us; if either reports "online", the server
  //                 counts as online (recommended, some servers block individual services)
  //   "mcstatus"  = mcstatus.io only
  //   "mcsrvstat" = mcsrvstat.us only
  provider: "auto",

  // Automatic refresh interval in seconds (minimum 30, the APIs cache for about a minute)
  refreshSeconds: 60,

  // Maximum number of player names shown per server
  maxPlayerNames: 12,

  // Show player heads next to the names. Loads images from mc-heads.net,
  // which means player names are sent to that service.
  playerHeads: false,

  // true = show sample data instead of querying real servers (handy for trying out themes).
  // The demo mode can also be switched on with ?demo=1 in the URL.
  demo: false
};
