(() => {
  "use strict";

  const cfg = window.STATUS_CONFIG;
  const STORAGE_KEY = "mc-status-theme";
  const params = new URLSearchParams(location.search);
  const demoMode = cfg.demo === true || params.get("demo") === "1";

  const $ = (id) => document.getElementById(id);
  const serversEl = $("servers");
  const themeButtonsEl = $("theme-buttons");

  /* ---------- Themes ---------- */

  const themeIds = cfg.themes.map((t) => t.id);

  function readStoredTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
  }

  function storeTheme(id) {
    try { localStorage.setItem(STORAGE_KEY, id); } catch (_) { /* privater Modus */ }
  }

  function resolveInitialTheme() {
    const fromUrl = params.get("theme");
    if (fromUrl && themeIds.includes(fromUrl)) return fromUrl;
    const stored = readStoredTheme();
    if (stored && themeIds.includes(stored)) return stored;
    return themeIds.includes(cfg.defaultTheme) ? cfg.defaultTheme : themeIds[0];
  }

  function applyTheme(id, { persist = true } = {}) {
    document.documentElement.dataset.theme = id;
    const color = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && color) meta.setAttribute("content", color);
    themeButtonsEl.querySelectorAll("button").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.theme === id));
    });
    if (persist) {
      storeTheme(id);
      const url = new URL(location.href);
      url.searchParams.set("theme", id);
      history.replaceState(null, "", url);
    }
  }

  function buildThemeSwitcher() {
    cfg.themes.forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "theme-btn";
      btn.dataset.theme = t.id;
      btn.setAttribute("aria-pressed", "false");
      btn.title = t.label;

      const sw = document.createElement("span");
      sw.className = "swatch";
      sw.setAttribute("aria-hidden", "true");
      sw.style.background = `linear-gradient(135deg, ${t.swatch[0]} 50%, ${t.swatch[1]} 50%)`;

      const label = document.createElement("span");
      label.className = "theme-btn-label";
      label.textContent = t.label;

      btn.append(sw, label);
      btn.addEventListener("click", () => applyTheme(t.id));
      themeButtonsEl.appendChild(btn);
    });
  }

  /* ---------- Daten holen ---------- */

  const DEMO_DATA = [
    { online: true, players: { online: 48213, max: 200000, list: ["Notch", "jeb_", "Dinnerbone", "Alex", "Steve", "Herobrine"] },
      version: "1.8 – 1.21", motd: "Willkommen auf dem Demo-Server", latency: 42 },
    { online: true, players: { online: 12, max: 100, list: [] },
      version: "1.21.4", motd: "Kleiner Survival-Server", latency: 88 },
    { online: false, players: { online: 0, max: 0, list: [] },
      version: "", motd: "", latency: null }
  ];

  async function fetchServer(server, index) {
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 200 + index * 120));
      return { ...DEMO_DATA[index % DEMO_DATA.length], icon: null };
    }

    const base = server.type === "bedrock"
      ? "https://api.mcsrvstat.us/bedrock/3/"
      : "https://api.mcsrvstat.us/3/";

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const started = performance.now();

    try {
      const res = await fetch(base + encodeURIComponent(server.address), { signal: controller.signal });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      return {
        online: data.online === true,
        players: {
          online: data.players?.online ?? 0,
          max: data.players?.max ?? 0,
          list: (data.players?.list || []).map((p) => (typeof p === "string" ? p : p.name)).filter(Boolean)
        },
        version: data.version || "",
        motd: (data.motd?.clean || []).join("\n"),
        icon: typeof data.icon === "string" && data.icon.startsWith("data:image/png;base64,") ? data.icon : null,
        latency: Math.round(performance.now() - started)
      };
    } catch (err) {
      return { error: true, online: false, players: { online: 0, max: 0, list: [] }, version: "", motd: "", icon: null };
    } finally {
      clearTimeout(timer);
    }
  }

  /* ---------- Rendering ---------- */

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderCard(server, data) {
    const card = el("article", "card " + (data.error ? "is-unknown" : data.online ? "is-online" : "is-offline"));

    const head = el("div", "card-head");
    const icon = el("div", "server-icon");
    if (data.icon) {
      const img = document.createElement("img");
      img.src = data.icon;
      img.alt = "";
      img.width = 64;
      img.height = 64;
      icon.appendChild(img);
    } else {
      icon.textContent = server.name.charAt(0).toUpperCase();
      icon.classList.add("server-icon-fallback");
    }

    const titles = el("div", "card-titles");
    titles.appendChild(el("h2", "card-title", server.name));
    const addr = el("div", "card-address");
    addr.appendChild(el("code", null, server.address));
    const copy = el("button", "copy-btn", "Kopieren");
    copy.type = "button";
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(server.address);
        copy.textContent = "Kopiert";
      } catch (_) {
        copy.textContent = "Fehler";
      }
      setTimeout(() => { copy.textContent = "Kopieren"; }, 1500);
    });
    addr.appendChild(copy);
    titles.appendChild(addr);

    const pill = el("span", "pill", data.error ? "Unbekannt" : data.online ? "Online" : "Offline");

    head.append(icon, titles, pill);
    card.appendChild(head);

    if (data.error) {
      card.appendChild(el("p", "motd muted", "Status konnte nicht abgefragt werden."));
      return card;
    }

    if (data.motd) card.appendChild(el("p", "motd", data.motd));

    if (data.online) {
      const { online, max } = data.players;
      const pct = max > 0 ? Math.min(100, Math.round((online / max) * 100)) : 0;

      const stats = el("div", "stats");
      const players = el("div", "stat");
      players.append(el("span", "stat-label muted", "Spieler"), el("strong", "stat-value", `${online.toLocaleString("de-DE")} / ${max.toLocaleString("de-DE")}`));
      stats.appendChild(players);

      if (data.version) {
        const v = el("div", "stat");
        v.append(el("span", "stat-label muted", "Version"), el("strong", "stat-value", data.version));
        stats.appendChild(v);
      }
      if (data.latency != null) {
        const l = el("div", "stat");
        l.append(el("span", "stat-label muted", "Antwortzeit"), el("strong", "stat-value", data.latency + " ms"));
        stats.appendChild(l);
      }
      card.appendChild(stats);

      const bar = el("div", "bar");
      bar.setAttribute("role", "progressbar");
      bar.setAttribute("aria-valuemin", "0");
      bar.setAttribute("aria-valuemax", "100");
      bar.setAttribute("aria-valuenow", String(pct));
      bar.setAttribute("aria-label", "Auslastung");
      const fill = el("div", "bar-fill");
      fill.style.width = pct + "%";
      bar.appendChild(fill);
      card.appendChild(bar);

      const names = data.players.list.slice(0, cfg.maxPlayerNames);
      if (names.length) {
        const list = el("ul", "player-list");
        names.forEach((n) => list.appendChild(el("li", "player", n)));
        const rest = data.players.list.length - names.length;
        if (rest > 0) list.appendChild(el("li", "player player-more", `+${rest}`));
        card.appendChild(list);
      }
    }

    return card;
  }

  function renderSummary(results) {
    const total = results.length;
    const online = results.filter((r) => r.online).length;
    const unknown = results.filter((r) => r.error).length;
    const summary = $("summary");

    let state, title;
    if (unknown === total) { state = "unknown"; title = "Status nicht verfügbar"; }
    else if (online === total) { state = "ok"; title = "Alle Systeme laufen"; }
    else if (online === 0) { state = "down"; title = "Große Störung"; }
    else { state = "partial"; title = "Teilweise Störung"; }

    summary.dataset.state = state;
    $("summary-title").textContent = title;
    $("summary-detail").textContent = ` ${online} von ${total} Servern online`;
  }

  async function refresh() {
    const btn = $("refresh");
    btn.disabled = true;
    btn.textContent = "Lade …";

    const results = await Promise.all(cfg.servers.map((s, i) => fetchServer(s, i)));

    serversEl.replaceChildren(...results.map((data, i) => renderCard(cfg.servers[i], data)));
    renderSummary(results);

    $("last-updated").textContent = "Stand: " + new Date().toLocaleTimeString("de-DE");
    btn.disabled = false;
    btn.textContent = "Aktualisieren";
  }

  /* ---------- Start ---------- */

  document.title = cfg.title;
  $("site-title").textContent = cfg.title;
  $("site-subtitle").textContent = cfg.subtitle || "";
  $("demo-note").hidden = !demoMode;

  buildThemeSwitcher();
  applyTheme(resolveInitialTheme(), { persist: false });

  $("refresh").addEventListener("click", refresh);
  refresh();
  setInterval(refresh, Math.max(30, cfg.refreshSeconds || 60) * 1000);
})();
