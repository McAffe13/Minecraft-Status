# Minecraft-Status

[Deutsch](README.de.md)

A status page for Minecraft servers that you can fork and fill with your own servers. It is made of static files only and runs directly on GitHub Pages, with no build step and no dependencies.

## Features

- Live status for any number of servers (Java and Bedrock) from [mcstatus.io](https://mcstatus.io) and [mcsrvstat.us](https://mcsrvstat.us). If either reports "online", the server counts as online, so servers like Hypixel that block individual services are not shown as offline by mistake
- Player count with a capacity bar, version, MOTD, server icon and player list
- Summary banner ("All systems operational", "Partial outage", …) with total players, a "last updated" time and a refresh countdown
- **10 languages:** English, Deutsch, Español, Français, Italiano, Português, Nederlands, Polski, Türkçe and Русский, with numbers, percentages and times formatted for each language
- **5 themes:** Modern, Classic, Neon, Light and Nether
- Pin the theme and language, or let visitors choose with a menu
- Everything customizable lives in the [`config/`](config/) folder, including logo, favicon and background image
- Demo mode with sample data (`?demo=1`) for trying things out
- Responsive, keyboard accessible, respects `prefers-reduced-motion`

## Quick start

1. Fork this repository.
2. Open `config/config.js` and enter your servers:

   ```js
   servers: [
     { name: "Survival", address: "play.example.net" },
     { name: "Bedrock", address: "bedrock.example.net:19132", type: "bedrock" }
   ]
   ```

3. In the repository settings under **Pages**, enable publishing (from a branch or with GitHub Actions).
4. Done. Your page is available at `https://<your-name>.github.io/<repo>/`.

To test locally, use any static file server, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/?demo=1`.

## The config folder

```
config/
  config.js        texts, servers, theme and language settings, behaviour
  themes/          one stylesheet per theme
  languages/       one file per language
  assets/          logo, favicon, background image, custom server icons
```

You do not need to change anything outside `config/`. The code lives in `index.html` and `assets/`.

### Language

```js
language: "en",              // default language
autoDetectLanguage: false,   // true = use the visitor's browser language on the first visit
allowLanguageSwitch: true,   // true = language menu, false = always use "language"
languages: [ { code: "en", label: "English" }, { code: "de", label: "Deutsch" } /* … */ ]
```

| `allowLanguageSwitch` | Behaviour |
| --------------------- | --------- |
| `true`  | A language menu appears. The choice is remembered in the browser and can be shared as a link (`?lang=de`). |
| `false` | No menu. Every visitor always sees `language`, and `?lang=` is ignored. |

With `autoDetectLanguage: true`, a visitor's first visit uses their browser language if it is in the `languages` list (for example `pt-BR` matches `pt`). Otherwise `language` is used. English is always the fallback for missing translations.

Texts in the config (`title`, `subtitle`, `footerText`, link labels and server `description`) can be a plain string or an object with one string per language:

```js
title: { en: "Our servers", de: "Unsere Server" }
```

#### Adding a language

1. Copy `config/languages/en.js` to `config/languages/<code>.js` (for example `sv.js`).
2. Translate the values. Keep the keys and the `{placeholders}` as they are, and change `en` in `window.STATUS_LANGS.en` to your code. For right-to-left languages, set `dir: "rtl"`.
3. Add `{ code: "sv", label: "Svenska" }` to `languages` in `config/config.js`.

### Theme

```js
theme: "modern",          // active theme
allowThemeSwitch: true,   // true = visitors may choose, false = fixed theme
```

| `allowThemeSwitch` | Behaviour |
| ------------------ | --------- |
| `true`  | A theme switcher appears. `theme` is the theme on the first visit. The choice is remembered in the browser and can be shared as a link (`?theme=neon`). |
| `false` | No switcher. Every visitor always sees `theme`, and `?theme=` is ignored. |

The `themes` list controls which themes are offered. Remove entries you do not want.

| Theme   | Look                                          |
| ------- | --------------------------------------------- |
| Modern  | Dark, glass effect, soft corners              |
| Classic | Minecraft GUI with dirt, grass and square frames |
| Neon    | Cyberpunk with glowing borders                |
| Light   | Bright and minimal                            |
| Nether  | Netherrack, lava and embers                   |

#### Adding a theme

1. Copy `config/themes/modern.css` to, for example, `config/themes/ocean.css`.
2. Change the selector to `:root[data-theme="ocean"]` and adjust the variables.
3. Add an entry to `themes` in `config/config.js`:

   ```js
   { id: "ocean", label: "Ocean", swatch: ["#04202e", "#18c1d8"] }
   ```

Theme stylesheets are loaded on demand, so you do not need to edit `index.html`.

### Logo, favicon and background

Put your files in `config/assets/` and reference them in the config:

```js
logo: "config/assets/logo.svg",
favicon: "config/assets/favicon.svg",
background: "config/assets/background.jpg",   // optional
```

You can also set a custom icon per server (`icon: "config/assets/survival.png"`). Without one, the server's own icon from the API is used.

### More options

| Option           | Meaning |
| ---------------- | ------- |
| `title`, `subtitle`, `footerText` | Page texts (string or per-language object) |
| `links`          | Links in the header, for example Discord or your website |
| `provider`       | `"auto"` (both services, default), `"mcstatus"` or `"mcsrvstat"` |
| `refreshSeconds` | Refresh interval (minimum 30) |
| `maxPlayerNames` | How many player names are shown per server |
| `playerHeads`    | Show player heads. Loads images from mc-heads.net, which means player names are sent to that service |
| `demo`           | Show sample data instead of querying real servers |

## Notes

- The APIs cache responses for about a minute, so a refresh interval below 30 seconds would not help and is ignored.
- In `"auto"` mode, both services are asked for every server on each refresh. "Unknown" is only shown when neither service could be reached.
- Servers that block every service, or that have query and ping disabled, are shown as offline.
- Server data such as the MOTD and player names is always rendered as plain text, never as HTML.

## License

[MPL 2.0](LICENSE)
