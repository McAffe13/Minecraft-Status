(() => {
  "use strict";

  const cfg = window.STATUS_CONFIG;
  const root = document.documentElement;

  if (!cfg) {
    root.dataset.ready = "1";
    document.body.textContent = "Konfiguration fehlt: config/config.js konnte nicht geladen werden.";
    return;
  }

  const STORAGE_KEY = "mc-status-theme";
  const params = new URLSearchParams(location.search);
  const demoMode = cfg.demo === true || params.get("demo") === "1";
  const refreshMs = Math.max(30, Number(cfg.refreshSeconds) || 60) * 1000;
  const numberFormat = new Intl.NumberFormat("de-DE");
  const servers = Array.isArray(cfg.servers) ? cfg.servers : [];

  const $ = (id) => document.getElementById(id);
  const serversEl = $("servers");
  const themeButtonsEl = $("theme-buttons");

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /* ============================================================
   *  Designs
   * ============================================================ */

  const ID_PATTERN = /^[a-z0-9_-]+$/i;

  const themes = (Array.isArray(cfg.themes) ? cfg.themes : [])
    .filter((t) => t && typeof t.id === "string" && ID_PATTERN.test(t.id))
    .map((t) => ({ id: t.id, label: t.label || t.id, swatch: t.swatch || ["#333333", "#999999"] }));

  const wanted = typeof cfg.theme === "string" && ID_PATTERN.test(cfg.theme) ? cfg.theme : "modern";
  if (!themes.some((t) => t.id === wanted)) {
    themes.unshift({ id: wanted, label: wanted, swatch: ["#333333", "#999999"] });
  }

  const themeIds = themes.map((t) => t.id);
  const defaultTheme = wanted;
  const allowSwitch = cfg.allowThemeSwitch !== false && themes.length > 1;

  function readStoredTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
  }

  function storeTheme(id) {
    try { localStorage.setItem(STORAGE_KEY, id); } catch (_) { /* privater Modus */ }
  }

  function resolveInitialTheme() {
    // Ist die Auswahl gesperrt, zählt ausschließlich die Konfiguration.
    if (!allowSwitch) return defaultTheme;
    const fromUrl = params.get("theme");
    if (fromUrl && themeIds.includes(fromUrl)) return fromUrl;
    const stored = readStoredTheme();
    if (stored && themeIds.includes(stored)) return stored;
    return defaultTheme;
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
          console.warn(`Design "${id}" konnte nicht geladen werden (config/themes/${id}.css).`);
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
    if (request !== themeRequest) return; // eine neuere Auswahl hat Vorrang

    root.dataset.theme = id;

    const color = getComputedStyle(root).getPropertyValue("--bg").trim();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && color) meta.setAttribute("content", color);

    themeButtonsEl.querySelectorAll("button").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.theme === id));
    });

    if (persist && allowSwitch) {
      storeTheme(id);
      const url = new URL(location.href);
      url.searchParams.set("theme", id);
      history.replaceState(null, "", url);
    }
  }

  function buildThemeSwitcher() {
    if (!allowSwitch) return;
    themes.forEach((t) => {
      const btn = el("button", "theme-btn");
      btn.type = "button";
      btn.dataset.theme = t.id;
      btn.setAttribute("aria-pressed", "false");
      btn.title = t.label;

      const swatch = el("span", "swatch");
      swatch.setAttribute("aria-hidden", "true");
      swatch.style.background = `linear-gradient(135deg, ${t.swatch[0]} 50%, ${t.swatch[1]} 50%)`;

      btn.append(swatch, el("span", "theme-btn-label", t.label));
      btn.addEventListener("click", () => applyTheme(t.id));
      themeButtonsEl.appendChild(btn);
      // Schon beim Hover vorladen, damit das Umschalten ohne Flackern klappt.
      btn.addEventListener("pointerenter", () => loadThemeCss(t.id), { once: true });
    });
    $("theme-switcher").hidden = false;
  }

  /* ============================================================
   *  Seitenkopf, Bilder, Links
   * ============================================================ */

  function isSafeUrl(url) {
    return typeof url === "string" && /^(https?:\/\/|\/|\.\/|\.\.\/|#|mailto:)/i.test(url);
  }

  function setupPage() {
    const title = cfg.title || "Minecraft Status";
    document.title = title;
    $("site-title").textContent = title;
    $("site-subtitle").textContent = cfg.subtitle || "";

    if (cfg.logo) {
      const img = document.createElement("img");
      img.src = cfg.logo;
      img.alt = "";
      img.addEventListener("error", () => { $("brand-logo").replaceChildren(); $("brand-logo").classList.remove("has-image"); });
      $("brand-logo").replaceChildren(img);
      $("brand-logo").classList.add("has-image");
    }

    if (cfg.favicon) $("favicon").href = cfg.favicon;

    if (cfg.background) {
      const bg = $("bg-custom");
      bg.style.backgroundImage = `url("${String(cfg.background).replace(/"/g, "%22")}")`;
      bg.classList.add("is-active");
    }

    const links = (Array.isArray(cfg.links) ? cfg.links : []).filter((l) => l && l.label && isSafeUrl(l.url));
    if (links.length) {
      const nav = $("header-links");
      links.forEach((l) => {
        const a = el("a", "header-link", l.label);
        a.href = l.url;
        a.rel = "noopener";
        if (/^https?:/i.test(l.url)) a.target = "_blank";
        nav.appendChild(a);
      });
      nav.hidden = false;
    }

    if (cfg.footerText) {
      const f = $("footer-text");
      f.textContent = cfg.footerText;
      f.hidden = false;
    }

    $("demo-note").hidden = !demoMode;
  }

  /* ============================================================
   *  Daten holen
   * ============================================================ */

  const DEMO_DATA = [
    { online: true,  players: { online: 48213, max: 200000, list: ["Notch", "jeb_", "Dinnerbone", "Alex", "Steve", "Herobrine", "Creeper42", "Enderman"] }, version: "1.8 – 1.21", motd: "Willkommen auf dem Demo-Server\nHeute: Doppelte XP!" },
    { online: true,  players: { online: 12, max: 100, list: ["Builder_Bob", "RedstoneQueen", "Zoe"] }, version: "1.21.4", motd: "Kleiner Survival-Server" },
    { online: false, players: { online: 0, max: 0, list: [] }, version: "", motd: "" }
  ];

  async function fetchServer(server, index) {
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 250 + index * 150));
      return { ...DEMO_DATA[index % DEMO_DATA.length], icon: null };
    }

    const base = server.type === "bedrock"
      ? "https://api.mcsrvstat.us/bedrock/3/"
      : "https://api.mcsrvstat.us/3/";

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(base + encodeURIComponent(server.address), { signal: controller.signal });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      return {
        online: data.online === true,
        players: {
          online: Number(data.players?.online) || 0,
          max: Number(data.players?.max) || 0,
          list: (data.players?.list || []).map((p) => (typeof p === "string" ? p : p.name)).filter(Boolean)
        },
        version: data.version || "",
        motd: (data.motd?.clean || []).join("\n"),
        icon: typeof data.icon === "string" && data.icon.startsWith("data:image/png;base64,") ? data.icon : null
      };
    } catch (_) {
      return { error: true, online: false, players: { online: 0, max: 0, list: [] }, version: "", motd: "", icon: null };
    } finally {
      clearTimeout(timer);
    }
  }

  /* ============================================================
   *  Rendering
   * ============================================================ */

  function renderSkeleton() {
    const count = Math.max(servers.length, 1);
    serversEl.replaceChildren(...Array.from({ length: count }, () => {
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

    /* Kopf */
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
      iconBox.textContent = (server.name || "?").charAt(0).toUpperCase();
      iconBox.classList.add("server-icon-fallback");
    }

    const titles = el("div", "card-titles");
    titles.appendChild(el("h2", "card-title", server.name));

    const addr = el("div", "card-address");
    addr.appendChild(el("span", "tag", server.type === "bedrock" ? "Bedrock" : "Java"));
    addr.appendChild(el("code", null, server.address));
    const copy = el("button", "copy-btn", "Kopieren");
    copy.type = "button";
    copy.setAttribute("aria-label", `Adresse von ${server.name} kopieren`);
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(server.address);
        copy.textContent = "Kopiert ✓";
      } catch (_) {
        copy.textContent = "Fehler";
      }
      setTimeout(() => { copy.textContent = "Kopieren"; }, 1500);
    });
    addr.appendChild(copy);
    titles.appendChild(addr);

    const pill = el("span", "pill", state === "unknown" ? "Unbekannt" : state === "online" ? "Online" : "Offline");

    head.append(iconBox, titles, pill);
    card.appendChild(head);

    if (data.error) {
      card.appendChild(el("p", "card-note muted", "Der Status konnte gerade nicht abgefragt werden."));
      return card;
    }

    if (!data.online) {
      card.appendChild(el("p", "card-note muted", "Der Server ist aktuell nicht erreichbar."));
      return card;
    }

    if (data.motd) card.appendChild(el("p", "motd", data.motd));

    /* Spieler */
    const { online, max } = data.players;
    const block = el("div", "players-block");
    const line = el("div", "players-line");
    line.appendChild(el("strong", "players-now", numberFormat.format(online)));
    line.appendChild(el("span", "players-max muted", max > 0 ? `/ ${numberFormat.format(max)} Spieler` : "Spieler online"));

    if (max > 0) {
      const pct = Math.min(100, Math.round((online / max) * 100));
      line.appendChild(el("span", "players-pct", `${pct} %`));

      const bar = el("div", "bar");
      bar.setAttribute("role", "progressbar");
      bar.setAttribute("aria-valuemin", "0");
      bar.setAttribute("aria-valuemax", "100");
      bar.setAttribute("aria-valuenow", String(pct));
      bar.setAttribute("aria-label", "Auslastung");
      const fill = el("div", "bar-fill");
      fill.style.setProperty("--w", pct + "%");
      bar.appendChild(fill);
      block.append(line, bar);
    } else {
      block.appendChild(line);
    }
    card.appendChild(block);

    if (data.version) {
      const meta = el("div", "meta");
      meta.append(el("span", "meta-label muted", "Version"), el("strong", "meta-value", data.version));
      card.appendChild(meta);
    }

    /* Spielerliste */
    const names = data.players.list.slice(0, Number(cfg.maxPlayerNames) || 12);
    if (names.length) {
      const list = el("ul", "player-list");
      names.forEach((name) => {
        const li = el("li", "player");
        if (cfg.playerHeads === true) {
          const head = document.createElement("img");
          head.className = "player-head";
          head.src = `https://mc-heads.net/avatar/${encodeURIComponent(name)}/20`;
          head.alt = "";
          head.width = 20;
          head.height = 20;
          head.loading = "lazy";
          head.referrerPolicy = "no-referrer";
          head.addEventListener("error", () => head.remove());
          li.appendChild(head);
        }
        li.appendChild(document.createTextNode(name));
        list.appendChild(li);
      });
      const rest = data.players.list.length - names.length;
      if (rest > 0) list.appendChild(el("li", "player player-more", `+${rest} weitere`));
      card.appendChild(list);
    }

    return card;
  }

  function renderSummary(results) {
    const total = results.length;
    const online = results.filter((r) => r.online).length;
    const unknown = results.filter((r) => r.error).length;
    const players = results.reduce((sum, r) => sum + (r.online ? r.players.online : 0), 0);

    let state, title;
    if (total === 0) { state = "unknown"; title = "Keine Server konfiguriert"; }
    else if (unknown === total) { state = "unknown"; title = "Status nicht verfügbar"; }
    else if (online === total) { state = "ok"; title = "Alle Systeme laufen"; }
    else if (online === 0) { state = "down"; title = "Große Störung"; }
    else { state = "partial"; title = "Teilweise Störung"; }

    $("summary").dataset.state = state;
    $("summary-title").textContent = title;

    const parts = [];
    if (total > 0 && unknown < total) {
      parts.push(`${online} von ${total} Servern online`);
      if (online > 0) parts.push(`${numberFormat.format(players)} Spieler`);
    }
    $("summary-detail").textContent = parts.join(" · ");
  }

  /* ============================================================
   *  Aktualisieren
   * ============================================================ */

  let firstRender = true;
  let inFlight = false;
  let lastRefresh = 0;

  async function refresh() {
    if (inFlight) return;
    inFlight = true;

    const btn = $("refresh");
    btn.disabled = true;
    btn.textContent = "Lade …";

    try {
      const results = await Promise.all(servers.map((s, i) => fetchServer(s, i)));
      serversEl.replaceChildren(...results.map((data, i) => renderCard(servers[i], data, i, firstRender)));
      firstRender = false;
      renderSummary(results);
      lastRefresh = Date.now();
      $("last-updated").textContent = "Stand: " + new Date().toLocaleTimeString("de-DE");
    } finally {
      btn.disabled = false;
      btn.textContent = "Aktualisieren";
      inFlight = false;
    }
  }

  /* ============================================================
   *  Start
   * ============================================================ */

  async function init() {
    setupPage();
    buildThemeSwitcher();
    renderSkeleton();

    // Seite erst zeigen, wenn das Design geladen ist (verhindert Flackern).
    const reveal = () => { root.dataset.ready = "1"; };
    const failsafe = setTimeout(reveal, 2500);
    await applyTheme(resolveInitialTheme(), { persist: false });
    clearTimeout(failsafe);
    reveal();

    $("refresh").addEventListener("click", refresh);
    refresh();

    setInterval(() => { if (!document.hidden) refresh(); }, refreshMs);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && Date.now() - lastRefresh > refreshMs) refresh();
    });
  }

  init();
})();
