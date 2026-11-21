(() => {
  "use strict";

  const cfg = window.STATUS_CONFIG;
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);

  if (!cfg) {
    root.dataset.ready = "1";
    document.body.textContent = "Configuration missing: config/config.js could not be loaded.";
    return;
  }

  const THEME_KEY = "mc-status-theme";
  const LANG_KEY = "mc-status-lang";
  const FALLBACK_LANG = "en";
  const ID_PATTERN = /^[a-z0-9_-]+$/i;

  const params = new URLSearchParams(location.search);
  const demoMode = cfg.demo === true || params.get("demo") === "1";
  const refreshMs = Math.max(30, Number(cfg.refreshSeconds) || 60) * 1000;
  const servers = Array.isArray(cfg.servers) ? cfg.servers : [];

  /* ============================================================
   *  Small helpers
   * ============================================================ */

  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* private mode */ } }
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // Icons are constant strings defined here, never built from server or user data.
  const ICONS = {
    "check": '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    "check-circle": '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
    "alert": '<path d="M12 3.5 2.5 20h19L12 3.5z"/><path d="M12 10v4.5M12 17.5v.01"/>',
    "x-circle": '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>',
    "help": '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1.1.9-1.1 1.7M12 17v.01"/>',
    "loader": '<path d="M12 3a9 9 0 1 0 9 9"/>',
    "globe": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
    "chevron": '<path d="m6 9 6 6 6-6"/>',
    "refresh": '<path d="M20 11a8 8 0 0 0-14.5-4M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.5 4M20 20v-4h-4"/>',
    "copy": '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'
  };

  function fillIcon(node, name) {
    node.classList.add("icon");
    node.setAttribute("aria-hidden", "true");
    node.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" focusable="false">' + (ICONS[name] || "") + "</svg>";
  }

  function icon(name) {
    const node = document.createElement("span");
    fillIcon(node, name);
    return node;
  }

  /* ============================================================
   *  Languages (i18n)
   * ============================================================ */

  const languages = (Array.isArray(cfg.languages) && cfg.languages.length ? cfg.languages : [{ code: FALLBACK_LANG, label: "English" }])
    .filter((l) => l && typeof l.code === "string" && ID_PATTERN.test(l.code))
    .map((l) => ({ code: l.code, label: l.label || l.code }));
  const languageCodes = languages.map((l) => l.code);
  const allowLangSwitch = cfg.allowLanguageSwitch !== false && languages.length > 1;

  let currentLang = FALLBACK_LANG;
  let langRequest = 0;
  const langLoads = new Map();
  const fmt = {};

  function loadLanguage(code) {
    if (window.STATUS_LANGS && window.STATUS_LANGS[code]) return Promise.resolve(true);
    if (!langLoads.has(code)) {
      langLoads.set(code, new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = `config/languages/${code}.js`;
        script.onload = () => resolve(Boolean(window.STATUS_LANGS && window.STATUS_LANGS[code]));
        script.onerror = () => {
          console.warn(`Language "${code}" could not be loaded (config/languages/${code}.js).`);
          resolve(false);
        };
        document.head.appendChild(script);
      }));
    }
    return langLoads.get(code);
  }

  // Look up a string in the current language, falling back to English, then to the key itself.
  function t(key, vars) {
    const langs = window.STATUS_LANGS || {};
    const own = langs[currentLang] && langs[currentLang].strings;
    const fallback = langs[FALLBACK_LANG] && langs[FALLBACK_LANG].strings;
    let text = (own && own[key]) ?? (fallback && fallback[key]) ?? key;
    if (vars) text = text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? vars[name] : match));
    return text;
  }

  // Config texts may be a string or an object keyed by language code.
  function localized(value) {
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
      return value[currentLang] ?? value[FALLBACK_LANG] ?? Object.values(value)[0] ?? "";
    }
    return "";
  }

  function buildFormatters() {
    const attempt = (make, fallback) => { try { return make(); } catch (_) { return fallback; } };
    fmt.number = attempt(() => new Intl.NumberFormat(currentLang), new Intl.NumberFormat());
    fmt.percent = attempt(() => new Intl.NumberFormat(currentLang, { style: "percent", maximumFractionDigits: 0 }), fmt.number);
    fmt.relative = attempt(() => new Intl.RelativeTimeFormat(currentLang, { numeric: "auto" }),
      { format: (value, unit) => `${value} ${unit}` });
  }

  function matchLanguage(candidate) {
    if (!candidate) return null;
    const lower = String(candidate).toLowerCase();
    const exact = languageCodes.find((c) => c.toLowerCase() === lower);
    if (exact) return exact;
    const base = lower.split("-")[0];
    return languageCodes.find((c) => c.toLowerCase() === base) || null;
  }

  function resolveInitialLanguage() {
    const configured = matchLanguage(cfg.language) || languageCodes[0] || FALLBACK_LANG;
    if (!allowLangSwitch) return configured;

    const fromUrl = matchLanguage(params.get("lang"));
    if (fromUrl) return fromUrl;

    const stored = matchLanguage(storage.get(LANG_KEY));
    if (stored) return stored;

    if (cfg.autoDetectLanguage === true) {
      const preferred = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
      for (const candidate of preferred) {
        const match = matchLanguage(candidate);
        if (match) return match;
      }
    }
    return configured;
  }

  function applyStaticTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll("[data-i18n-aria]").forEach((node) => { node.setAttribute("aria-label", t(node.dataset.i18nAria)); });

    const description = t("meta.description");
    const metaDescription = document.querySelector('meta[name="description"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (metaDescription) metaDescription.setAttribute("content", description);
    if (ogDescription) ogDescription.setAttribute("content", description);
  }

  async function setLanguage(code, { persist = true } = {}) {
    const request = ++langRequest;
    await Promise.all([loadLanguage(FALLBACK_LANG), loadLanguage(code)]);
    if (request !== langRequest) return; // a newer selection wins

    const available = window.STATUS_LANGS && window.STATUS_LANGS[code];
    currentLang = available ? code : FALLBACK_LANG;
    const meta = (window.STATUS_LANGS && window.STATUS_LANGS[currentLang]) || {};

    root.lang = currentLang;
    root.dir = meta.dir === "rtl" ? "rtl" : "ltr";
    buildFormatters();
    $("language-select").value = currentLang;

    applyStaticTranslations();
    applyLocalizedConfig();
    updateRefreshButton();
    renderAll();

    if (persist && allowLangSwitch) {
      storage.set(LANG_KEY, currentLang);
      const url = new URL(location.href);
      url.searchParams.set("lang", currentLang);
      history.replaceState(null, "", url);
    }
  }

  function buildLanguageSwitcher() {
    if (!allowLangSwitch) return;
    const select = $("language-select");
    languages.forEach((l) => {
      const option = document.createElement("option");
      option.value = l.code;
      option.textContent = l.label;
      select.appendChild(option);
    });
    select.addEventListener("change", () => setLanguage(select.value));
    $("language-switcher").hidden = false;
  }

  /* ============================================================
   *  Themes
   * ============================================================ */

  const themes = (Array.isArray(cfg.themes) ? cfg.themes : [])
    .filter((th) => th && typeof th.id === "string" && ID_PATTERN.test(th.id))
    .map((th) => ({ id: th.id, label: th.label || th.id, swatch: th.swatch || ["#333333", "#999999"] }));

  const wantedTheme = typeof cfg.theme === "string" && ID_PATTERN.test(cfg.theme) ? cfg.theme : "modern";
  if (!themes.some((th) => th.id === wantedTheme)) {
    themes.unshift({ id: wantedTheme, label: wantedTheme, swatch: ["#333333", "#999999"] });
  }
  const themeIds = themes.map((th) => th.id);
  const allowThemeSwitch = cfg.allowThemeSwitch !== false && themes.length > 1;
  const themeLabelNodes = new Map();

  function resolveInitialTheme() {
    // With the switcher disabled, only the configuration counts.
    if (!allowThemeSwitch) return wantedTheme;
    const fromUrl = params.get("theme");
    if (fromUrl && themeIds.includes(fromUrl)) return fromUrl;
    const stored = storage.get(THEME_KEY);
    if (stored && themeIds.includes(stored)) return stored;
    return wantedTheme;
  }

  const themeLoads = new Map();

  function loadThemeCss(id) {
    if (!themeLoads.has(id)) {
      themeLoads.set(id, new Promise((resolve) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `config/themes/${id}.css`;
        link.onload = () => resolve(true);
        link.onerror = () => {
          console.warn(`Theme "${id}" could not be loaded (config/themes/${id}.css).`);
          resolve(false);
        };
        document.head.appendChild(link);
      }));
    }
    return themeLoads.get(id);
  }

  let themeRequest = 0;

  async function applyTheme(id, { persist = true } = {}) {
    const request = ++themeRequest;
    await loadThemeCss(id);
    if (request !== themeRequest) return; // a newer selection wins

    root.dataset.theme = id;

    const color = getComputedStyle(root).getPropertyValue("--bg").trim();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && color) meta.setAttribute("content", color);

    $("theme-buttons").querySelectorAll("button").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.theme === id));
    });

    if (persist && allowThemeSwitch) {
      storage.set(THEME_KEY, id);
      const url = new URL(location.href);
      url.searchParams.set("theme", id);
      history.replaceState(null, "", url);
    }
  }

  function buildThemeSwitcher() {
    if (!allowThemeSwitch) return;
    themes.forEach((th) => {
      const btn = el("button", "theme-btn");
      btn.type = "button";
      btn.dataset.theme = th.id;
      btn.setAttribute("aria-pressed", "false");

      const swatch = el("span", "swatch");
      swatch.setAttribute("aria-hidden", "true");
      swatch.style.background = `linear-gradient(135deg, ${th.swatch[0]} 50%, ${th.swatch[1]} 50%)`;

      const label = el("span", "theme-btn-label");
      themeLabelNodes.set(th.id, { label, btn, theme: th });

      btn.append(swatch, label);
      btn.addEventListener("click", () => applyTheme(th.id));
      // Preload on hover so switching does not flicker.
      btn.addEventListener("pointerenter", () => loadThemeCss(th.id), { once: true });
      $("theme-buttons").appendChild(btn);
    });
    $("theme-switcher").hidden = false;
  }

  /* ============================================================
   *  Page setup (header, images, links, texts)
   * ============================================================ */

  function isSafeUrl(url) {
    return typeof url === "string" && /^(https?:\/\/|\/|\.\/|\.\.\/|#|mailto:)/i.test(url);
  }

  // One-time setup that does not depend on the language.
  function setupPage() {
    document.querySelectorAll("[data-icon]").forEach((node) => fillIcon(node, node.dataset.icon));

    if (cfg.logo) {
      const img = document.createElement("img");
      img.src = cfg.logo;
      img.alt = "";
      img.addEventListener("error", () => {
        $("brand-logo").replaceChildren();
        $("brand-logo").classList.remove("has-image");
      });
      $("brand-logo").replaceChildren(img);
      $("brand-logo").classList.add("has-image");
    }

    if (cfg.favicon) $("favicon").href = cfg.favicon;

    if (cfg.background) {
      const bg = $("bg-custom");
      bg.style.backgroundImage = `url("${String(cfg.background).replace(/"/g, "%22")}")`;
      bg.classList.add("is-active");
    }

    $("demo-note").hidden = !demoMode;

    const source = $("data-source");
    const providerList = providerNames.map((name) => PROVIDERS[name]);
    providerList.forEach((provider, i) => {
      if (i > 0) source.appendChild(document.createTextNode(" & "));
      const a = el("a", null, provider.label);
      a.href = provider.home;
      a.rel = "noopener";
      source.appendChild(a);
    });
  }

  // Everything from the config that can be translated; re-run on every language change.
  function applyLocalizedConfig() {
    const title = localized(cfg.title) || "Minecraft Status";
    document.title = title;
    $("site-title").textContent = title;
    $("site-subtitle").textContent = localized(cfg.subtitle) || t("subtitle.default");

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", title);

    const nav = $("header-links");
    nav.replaceChildren();
    const links = (Array.isArray(cfg.links) ? cfg.links : []).filter((l) => l && l.label && isSafeUrl(l.url));
    links.forEach((l) => {
      const a = el("a", "header-link", localized(l.label));
      a.href = l.url;
      a.rel = "noopener";
      if (/^https?:/i.test(l.url)) a.target = "_blank";
      nav.appendChild(a);
    });
    nav.hidden = links.length === 0;

    const footer = $("footer-text");
    const footerText = localized(cfg.footerText);
    footer.textContent = footerText;
    footer.hidden = !footerText;

    themeLabelNodes.forEach(({ label, btn, theme }) => {
      const text = localized(theme.label) || theme.id;
      label.textContent = text;
      btn.title = text;
    });
  }

  /* ============================================================
   *  Fetching server status
   * ============================================================ */

  const DEMO_DATA = [
    { online: true, players: { online: 48213, max: 200000, list: ["Notch", "jeb_", "Dinnerbone", "Alex", "Steve", "Herobrine", "Creeper42", "Enderman"] },
      version: "1.8 – 1.21", motd: "Welcome to the demo server\nToday: double XP!" },
    { online: true, players: { online: 12, max: 100, list: ["Builder_Bob", "RedstoneQueen", "Zoe"] },
      version: "1.21.4", motd: "A small survival server" },
    { online: false, players: { online: 0, max: 0, list: [] }, version: "", motd: "" }
  ];

  function safeIcon(value) {
    return typeof value === "string" && value.startsWith("data:image/png;base64,") ? value : null;
  }

  // Two independent status APIs. Some servers (for example Hypixel) block or confuse
  // individual services, so by default both are asked and either one can say "online".
  const PROVIDERS = {
    mcstatus: {
      label: "mcstatus.io",
      home: "https://mcstatus.io",
      url: (s) => `https://api.mcstatus.io/v2/status/${s.type === "bedrock" ? "bedrock" : "java"}/${encodeURIComponent(s.address)}`,
      normalize: (d) => ({
        online: d.online === true,
        players: {
          online: Number(d.players && d.players.online) || 0,
          max: Number(d.players && d.players.max) || 0,
          list: ((d.players && d.players.list) || []).map((p) => p.name_clean || p.name_raw).filter(Boolean)
        },
        version: (d.version && (d.version.name_clean || d.version.name_raw)) || "",
        motd: (d.motd && d.motd.clean) || "",
        icon: d.icon
      })
    },
    mcsrvstat: {
      label: "mcsrvstat.us",
      home: "https://mcsrvstat.us",
      url: (s) => `https://api.mcsrvstat.us/${s.type === "bedrock" ? "bedrock/" : ""}3/${encodeURIComponent(s.address)}`,
      normalize: (d) => ({
        online: d.online === true,
        players: {
          online: Number(d.players && d.players.online) || 0,
          max: Number(d.players && d.players.max) || 0,
          list: ((d.players && d.players.list) || []).map((p) => (typeof p === "string" ? p : p.name)).filter(Boolean)
        },
        version: d.version || "",
        motd: ((d.motd && d.motd.clean) || []).join("\n"),
        icon: d.icon
      })
    }
  };

  const providerNames = PROVIDERS[cfg.provider] ? [cfg.provider] : ["mcstatus", "mcsrvstat"];

  async function queryProvider(provider, server) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(provider.url(server), { signal: controller.signal });
      if (!res.ok) return null;
      const result = provider.normalize(await res.json());
      result.icon = safeIcon(result.icon);
      return result;
    } catch (_) {
      return null; // network error or timeout: this service gives no answer
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchServer(server, index) {
    if (demoMode) {
      await new Promise((resolve) => setTimeout(resolve, 250 + index * 150));
      return { ...DEMO_DATA[index % DEMO_DATA.length], icon: null };
    }

    const answers = (await Promise.all(providerNames.map((name) => queryProvider(PROVIDERS[name], server)))).filter(Boolean);
    if (!answers.length) {
      return { error: true, online: false, players: { online: 0, max: 0, list: [] }, version: "", motd: "", icon: null };
    }
    // If at least one service reports "online", the server counts as online.
    return answers.find((a) => a.online) || answers[0];
  }

  /* ============================================================
   *  Rendering
   * ============================================================ */

  let lastResults = null; // null until the first refresh has finished
  let lastRefresh = 0;
  let inFlight = false;
  let toastTimer = 0;

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) { /* fall through to the legacy method */ }
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch (_) {
      return false;
    }
  }

  function renderSkeleton() {
    const count = Math.max(servers.length, 1);
    $("servers").replaceChildren(...Array.from({ length: count }, () => {
      const card = el("article", "card card-skeleton");
      card.setAttribute("aria-hidden", "true");
      card.append(el("div", "sk sk-head"), el("div", "sk sk-line"), el("div", "sk sk-line sk-short"), el("div", "sk sk-bar"));
      return card;
    }));
  }

  function renderCard(server, data, index, animate) {
    const state = data.error ? "unknown" : data.online ? "online" : "offline";
    const card = el("article", `card is-${state}${animate ? " is-new" : ""}`);
    card.style.setProperty("--i", String(index));

    /* Header */
    const head = el("div", "card-head");

    const iconBox = el("div", "server-icon");
    const iconSrc = server.icon || data.icon;
    if (iconSrc) {
      const img = document.createElement("img");
      img.src = iconSrc;
      img.alt = "";
      img.width = 64;
      img.height = 64;
      iconBox.appendChild(img);
    } else {
      iconBox.textContent = String(server.name || "?").charAt(0).toUpperCase();
      iconBox.classList.add("server-icon-fallback");
    }

    const titles = el("div", "card-titles");
    titles.appendChild(el("h3", "card-title", server.name));

    const description = localized(server.description);
    if (description) titles.appendChild(el("p", "card-desc muted", description));

    const tags = el("div", "card-tags");
    tags.appendChild(el("span", "tag", server.type === "bedrock" ? "Bedrock" : "Java"));
    titles.appendChild(tags);

    const addr = el("div", "card-address");
    addr.appendChild(el("code", null, server.address));

    const copy = el("button", "copy-btn");
    copy.type = "button";
    copy.title = t("card.copy");
    copy.setAttribute("aria-label", t("card.copyAria", { name: server.name }));
    copy.appendChild(icon("copy"));
    copy.addEventListener("click", async () => {
      const ok = await copyText(server.address);
      showToast(t(ok ? "toast.copied" : "toast.copyFailed"));
      if (ok) {
        copy.replaceChildren(icon("check"));
        copy.classList.add("is-done");
        setTimeout(() => { copy.replaceChildren(icon("copy")); copy.classList.remove("is-done"); }, 1600);
      }
    });
    addr.appendChild(copy);

    const pill = el("span", "pill", t(`status.${state}`));
    head.append(iconBox, titles, pill);
    card.append(head, addr);

    /* Offline or unknown */
    if (state !== "online") {
      const note = el("div", "card-note");
      note.append(icon(state === "unknown" ? "help" : "x-circle"), el("span", null, t(state === "unknown" ? "card.unknown" : "card.offline")));
      card.appendChild(note);
      return card;
    }

    /* Online */
    if (data.motd) card.appendChild(el("p", "motd", data.motd));

    const { online, max } = data.players;
    const block = el("div", "players-block");
    block.appendChild(el("div", "players-label muted", t("card.players")));

    const line = el("div", "players-line");
    line.appendChild(el("strong", "players-now", fmt.number.format(online)));
    if (max > 0) {
      line.appendChild(el("span", "players-max muted", `/ ${fmt.number.format(max)}`));
      const ratio = Math.min(1, online / max);
      line.appendChild(el("span", "players-pct", fmt.percent.format(ratio)));
      block.appendChild(line);

      const bar = el("div", "bar");
      bar.setAttribute("role", "progressbar");
      bar.setAttribute("aria-label", t("card.capacity"));
      bar.setAttribute("aria-valuemin", "0");
      bar.setAttribute("aria-valuemax", "100");
      bar.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
      const fill = el("div", "bar-fill");
      fill.style.setProperty("--w", (ratio * 100).toFixed(1) + "%");
      bar.appendChild(fill);
      block.appendChild(bar);
    } else {
      block.appendChild(line);
    }
    card.appendChild(block);

    if (data.version) {
      const meta = el("div", "meta");
      meta.append(el("span", "meta-label muted", t("card.version")), el("strong", "meta-value", data.version));
      card.appendChild(meta);
    }

    const names = data.players.list.slice(0, Number(cfg.maxPlayerNames) || 12);
    if (names.length) {
      const list = el("ul", "player-list");
      names.forEach((name) => {
        const li = el("li", "player");
        if (cfg.playerHeads === true) {
          const headImg = document.createElement("img");
          headImg.className = "player-head";
          headImg.src = `https://mc-heads.net/avatar/${encodeURIComponent(name)}/20`;
          headImg.alt = "";
          headImg.width = 20;
          headImg.height = 20;
          headImg.loading = "lazy";
          headImg.referrerPolicy = "no-referrer";
          headImg.addEventListener("error", () => headImg.remove());
          li.appendChild(headImg);
        }
        li.appendChild(document.createTextNode(name));
        list.appendChild(li);
      });
      const rest = data.players.list.length - names.length;
      if (rest > 0) list.appendChild(el("li", "player player-more", t("card.more", { count: fmt.number.format(rest) })));
      card.appendChild(list);
    }

    return card;
  }

  const STATE_ICON = { loading: "loader", ok: "check-circle", partial: "alert", down: "x-circle", unknown: "help" };

  function renderSummary() {
    let state = "loading";
    let title = t("summary.loading");
    let serversText = "–";
    let playersText = "–";

    if (lastResults) {
      const total = lastResults.length;
      const online = lastResults.filter((r) => r.online).length;
      const unknown = lastResults.filter((r) => r.error).length;
      const players = lastResults.reduce((sum, r) => sum + (r.online ? r.players.online : 0), 0);

      if (total === 0) { state = "unknown"; title = t("summary.none"); }
      else if (unknown === total) { state = "unknown"; title = t("summary.unknown"); }
      else if (online === total) { state = "ok"; title = t("summary.ok"); }
      else if (online === 0) { state = "down"; title = t("summary.down"); }
      else { state = "partial"; title = t("summary.partial"); }

      if (total > 0 && unknown < total) {
        serversText = `${fmt.number.format(online)} / ${fmt.number.format(total)}`;
        playersText = fmt.number.format(players);
      }
    }

    $("summary").dataset.state = state;
    fillIcon($("summary-icon"), STATE_ICON[state]);
    $("summary-title").textContent = title;
    $("stat-servers").textContent = serversText;
    $("stat-players").textContent = playersText;
    updateRelativeTime();
  }

  function renderAll({ animate = false } = {}) {
    if (!lastResults) {
      renderSkeleton();
    } else {
      $("servers").replaceChildren(...lastResults.map((data, i) => renderCard(servers[i], data, i, animate)));
    }
    renderSummary();
  }

  function updateRelativeTime() {
    const node = $("stat-updated");
    if (!lastRefresh) {
      node.textContent = "–";
      node.removeAttribute("datetime");
      node.removeAttribute("title");
      return;
    }
    const seconds = Math.round((lastRefresh - Date.now()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    node.textContent = Math.abs(seconds) < 60 ? fmt.relative.format(seconds, "second")
      : Math.abs(minutes) < 60 ? fmt.relative.format(minutes, "minute")
      : fmt.relative.format(hours, "hour");
    node.dateTime = new Date(lastRefresh).toISOString();
    node.title = new Date(lastRefresh).toLocaleString(currentLang);
  }

  function updateRefreshButton() {
    const btn = $("refresh");
    btn.disabled = inFlight;
    btn.classList.toggle("is-loading", inFlight);
    btn.setAttribute("aria-busy", String(inFlight));
    $("refresh-label").textContent = t(inFlight ? "action.refreshing" : "action.refresh");
  }

  function restartProgress() {
    const bar = $("progress-bar");
    bar.style.setProperty("--cycle", refreshMs + "ms");
    bar.classList.remove("run");
    void bar.offsetWidth; // restart the CSS animation
    bar.classList.add("run");
  }

  /* ============================================================
   *  Refresh loop
   * ============================================================ */

  async function refresh() {
    if (inFlight) return;
    inFlight = true;
    updateRefreshButton();

    try {
      const results = await Promise.all(servers.map((s, i) => fetchServer(s, i)));
      const firstTime = lastResults === null;
      lastResults = results;
      lastRefresh = Date.now();
      renderAll({ animate: firstTime });
      restartProgress();
    } finally {
      inFlight = false;
      updateRefreshButton();
    }
  }

  /* ============================================================
   *  Start
   * ============================================================ */

  async function init() {
    setupPage();
    buildThemeSwitcher();
    buildLanguageSwitcher();

    // Show the page only once the theme and language are ready (prevents flicker).
    const reveal = () => { root.dataset.ready = "1"; };
    const failsafe = setTimeout(reveal, 2500);
    await Promise.all([
      setLanguage(resolveInitialLanguage(), { persist: false }),
      applyTheme(resolveInitialTheme(), { persist: false })
    ]);
    clearTimeout(failsafe);
    reveal();

    $("refresh").addEventListener("click", refresh);
    refresh();

    setInterval(() => { if (!document.hidden) refresh(); }, refreshMs);
    setInterval(updateRelativeTime, 1000);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && Date.now() - lastRefresh > refreshMs) refresh();
    });
  }

  init();
})();
