/*
 * English (default and fallback language).
 *
 * To add a language: copy this file to config/languages/<code>.js, translate the
 * values (keep the keys and the {placeholders}), then add the language to the
 * `languages` list in config/config.js.
 */
window.STATUS_LANGS = window.STATUS_LANGS || {};
window.STATUS_LANGS.en = {
  name: "English",
  dir: "ltr",
  strings: {
    "meta.description": "Live status of our Minecraft servers.",
    "a11y.skip": "Skip to content",
    "subtitle.default": "Live server status",

    "header.links": "Links",
    "header.language": "Language",
    "header.theme": "Theme",
    "section.servers": "Servers",

    "action.refresh": "Refresh",
    "action.refreshing": "Refreshing…",

    "summary.loading": "Checking server status…",
    "summary.ok": "All systems operational",
    "summary.partial": "Partial outage",
    "summary.down": "Major outage",
    "summary.unknown": "Status unavailable",
    "summary.none": "No servers configured",

    "stat.servers": "Servers online",
    "stat.players": "Players online",
    "stat.updated": "Last updated",

    "status.online": "Online",
    "status.offline": "Offline",
    "status.unknown": "Unknown",

    "card.copy": "Copy address",
    "card.copyAria": "Copy address of {name}",
    "card.players": "Players online",
    "card.capacity": "Server capacity",
    "card.version": "Version",
    "card.more": "+{count} more",
    "card.offline": "This server is currently unreachable.",
    "card.unknown": "The status could not be retrieved right now.",

    "toast.copied": "Address copied to clipboard",
    "toast.copyFailed": "Could not copy the address",

    "footer.dataFrom": "Data from",
    "footer.source": "Source code on GitHub",

    "demo.note": "Demo mode: sample data is shown, no real servers are queried."
  }
};
