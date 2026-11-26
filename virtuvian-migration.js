/* Virtuvian shared navigation.
   Desktop: dropdowns and the Beacons of Thought mega menu open with hover intent, click or keyboard.
   Phones and tablets (and Ctrl/Cmd+K anywhere): a full-screen route sheet with sections, subsections and search.
   The menu structure is read from the page's own .desktop-nav, so the static HTML stays the single source. */
(() => {
  "use strict";
  const d = document, root = d.documentElement;
  const nav = d.querySelector(".desktop-nav .wsite-menu-default");
  if (!nav) return;
  root.classList.add("vn-js");

  const clean = (s) => String(s || "").trim().replace(/\s{2,}/g, " — ").replace(/\s+/g, " ");
  const canon = (u) => { try { return new URL(u, location.href).pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/"; } catch (e) { return u; } };
  const here = canon(location.href);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const names = {};
  try { JSON.parse(d.getElementById("e14-data").textContent).pages.forEach((p) => { names[canon(p.url)] = p.title; }); } catch (e) { /* no page list on this page */ }
  const named = (href, fallback) => names[canon(href)] || fallback;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desktop = matchMedia("(min-width: 993px)");

  /* ---------- model ---------- */
  const tree = [...nav.children].map((li, i) => {
    const a = li.querySelector(":scope > a.wsite-menu-item");
    if (!a) return null;
    const node = { i, li, title: named(a.getAttribute("href"), clean(a.textContent)), href: a.getAttribute("href"), groups: [], intro: null };
    const mega = li.querySelector(":scope > .vn-mega");
    const wrap = li.querySelector(":scope > .wsite-menu-wrap");
    if (mega) {
      const lede = mega.querySelector(".vn-lede");
      node.intro = lede ? lede.textContent.trim() : "";
      mega.querySelectorAll(".vn-group").forEach((g) => node.groups.push({
        title: g.querySelector(".vn-group-title")?.textContent.trim() || "",
        sub: g.querySelector(".vn-group-sub")?.textContent.trim() || "",
        items: [...g.querySelectorAll("a.wsite-menu-subitem")].map((x) => ({
          title: x.querySelector(".wsite-menu-title")?.textContent.trim() || clean(x.textContent),
          href: x.getAttribute("href"), num: x.querySelector(".vn-num")?.textContent.trim() || "",
          sub: x.querySelector(".vn-sub")?.textContent.trim() || "",
        })),
      }));
    } else if (wrap) {
      const items = [];
      wrap.querySelectorAll(":scope > .wsite-menu > li").forEach((sli) => {
        const sa = sli.querySelector(":scope > a");
        const tsp = sa && sa.querySelector(".wsite-menu-title");
        if (tsp && names[canon(sa.getAttribute("href"))]) tsp.textContent = names[canon(sa.getAttribute("href"))];
        if (sa) items.push({ title: named(sa.getAttribute("href"), clean(sa.querySelector(".wsite-menu-title")?.textContent || sa.textContent)), href: sa.getAttribute("href") });
        sli.querySelectorAll(":scope > .wsite-menu-wrap a.wsite-menu-subitem").forEach((c) => {
          const ct = c.querySelector(".wsite-menu-title");
          if (ct && names[canon(c.getAttribute("href"))]) ct.textContent = names[canon(c.getAttribute("href"))];
          items.push({ title: named(c.getAttribute("href"), clean(c.textContent)), href: c.getAttribute("href"), child: true });
        });
      });
      node.groups.push({ title: "", sub: "", items });
    }
    node.count = node.groups.reduce((n, g) => n + g.items.length, 0);
    node.contains = (p) => canon(node.href) === p || node.groups.some((g) => g.items.some((it) => canon(it.href) === p));
    return node;
  }).filter(Boolean);

  /* ---------- desktop menus ---------- */
  const scrim = d.createElement("div");
  scrim.className = "vn-scrim";
  scrim.setAttribute("aria-hidden", "true");
  d.body.appendChild(scrim);
  let openLi = null, tOpen = 0, tClose = 0;

  function setTop() {
    const bar = d.querySelector(".cento-header .nav-wrap") || nav;
    root.style.setProperty("--vn-top", Math.max(0, Math.round(bar.getBoundingClientRect().bottom)) + "px");
  }
  function open(li) {
    clearTimeout(tClose);
    if (openLi === li) return;
    if (openLi) close(openLi, true);
    setTop();
    li.classList.add("vn-open");
    li.querySelector(":scope > .vn-caret")?.setAttribute("aria-expanded", "true");
    root.classList.toggle("vn-mega-open", li.classList.contains("vn-mega-host"));
    openLi = li;
  }
  function close(li = openLi, instant) {
    if (!li) return;
    li.classList.remove("vn-open");
    li.querySelector(":scope > .vn-caret")?.setAttribute("aria-expanded", "false");
    if (openLi === li) { openLi = null; root.classList.remove("vn-mega-open"); }
  }
  const caretSvg = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

  tree.forEach((node) => {
    const li = node.li, panel = li.querySelector(":scope > .wsite-menu-wrap");
    if (!panel) return;
    panel.id = panel.id || "vn-panel-" + node.i;
    panel.removeAttribute("style");
    const link = li.querySelector(":scope > a.wsite-menu-item");
    const caret = d.createElement("button");
    caret.type = "button";
    caret.className = "vn-caret";
    caret.innerHTML = caretSvg;
    caret.setAttribute("aria-expanded", "false");
    caret.setAttribute("aria-controls", panel.id);
    caret.setAttribute("aria-label", "Show the pages of " + node.title);
    link.after(caret);
    caret.addEventListener("click", (e) => {
      e.preventDefault();
      if (li.classList.contains("vn-open")) close(li);
      else { open(li); setTimeout(() => panel.querySelector("a")?.focus({ preventScroll: true }), reduce ? 0 : 60); }
    });
    li.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse" || !desktop.matches) return;
      clearTimeout(tClose); clearTimeout(tOpen);
      tOpen = setTimeout(() => open(li), openLi ? 0 : 90);
    });
    li.addEventListener("pointerleave", (e) => {
      if (e.pointerType !== "mouse") return;
      clearTimeout(tOpen);
      tClose = setTimeout(() => { if (openLi === li) close(li); }, 280);
    });
    link.addEventListener("click", (e) => {
      if (!desktop.matches) return;
      if (e.pointerType && e.pointerType !== "mouse" && !li.classList.contains("vn-open")) { e.preventDefault(); open(li); }
    });
    li.addEventListener("focusout", (e) => { if (!li.contains(e.relatedTarget) && openLi === li) close(li); });
    panel.addEventListener("keydown", (e) => {
      if (!["ArrowDown", "ArrowUp"].includes(e.key)) return;
      const links = [...panel.querySelectorAll("a")], k = links.indexOf(d.activeElement);
      if (k < 0) return;
      e.preventDefault();
      links[(k + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length].focus();
    });
  });
  scrim.addEventListener("click", () => close());
  d.addEventListener("pointerdown", (e) => { if (openLi && !openLi.contains(e.target)) close(); });
  d.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && openLi) { const li = openLi; close(li); li.querySelector(":scope > .vn-caret")?.focus(); }
  });
  addEventListener("scroll", () => { if (openLi) setTop(); }, { passive: true });
  addEventListener("resize", () => { if (openLi) setTop(); });
  desktop.addEventListener("change", () => close());

  /* ---------- route sheet ---------- */
  const toggle = d.createElement("button");
  toggle.id = "vn-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-haspopup", "dialog");
  toggle.setAttribute("aria-controls", "vn-sheet");
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = '<span class="vn-burger" aria-hidden="true"></span><span>Menu</span>';

  const sheet = d.createElement("dialog");
  sheet.id = "vn-sheet";
  sheet.setAttribute("aria-label", "Site menu");
  const searchSvg = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m11 11 3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  sheet.innerHTML =
    '<div class="vn-top"><div class="vn-brand"><b>Virtuvian</b><span>Aivar Drukalski · Ealoiontoir</span></div>' +
    '<button type="button" class="vn-iconbtn" data-vn-close aria-label="Close menu">✕</button></div>' +
    '<div class="vn-search"><label>' + searchSvg + '<input type="search" enterkeyhint="go" autocomplete="off" placeholder="Search all pages" aria-label="Search all pages"><kbd>' + (isMac ? "⌘K" : "Ctrl K") + '</kbd></label></div>' +
    '<nav class="vn-crumb" aria-label="Where you are in the menu"></nav>' +
    '<div class="vn-stage"></div>';
  d.body.append(toggle, sheet);

  const stage = sheet.querySelector(".vn-stage"), crumb = sheet.querySelector(".vn-crumb"), input = sheet.querySelector("input");
  const cur = (h) => (canon(h) === here ? ' aria-current="page"' : "");
  const item = (it, cls = "") =>
    '<li><a class="vn-link ' + cls + (it.child ? " vn-child" : "") + '" href="' + esc(it.href) + '"' + cur(it.href) + ">" +
    (it.num ? '<span class="vn-num">' + esc(it.num) + "</span>" : "") +
    '<span class="vn-t">' + esc(it.title) + (it.sub ? "<small>" + esc(it.sub) + "</small>" : "") + "</span>" +
    '<span class="vn-chev" aria-hidden="true">→</span></a></li>';

  const panels = [];
  const rootPanel = d.createElement("div");
  rootPanel.className = "vn-panel";
  rootPanel.innerHTML = '<ul class="vn-list">' + tree.map((n) => n.count
    ? '<li><button type="button" class="vn-row' + (n.contains(here) ? " is-here" : "") + '" data-vn-go="' + n.i + '"><span class="vn-t">' + esc(n.title) + "</span><em>" + n.count + '</em><span class="vn-chev" aria-hidden="true">›</span></button></li>'
    : '<li><a class="vn-row" href="' + esc(n.href) + '"' + cur(n.href) + '><span class="vn-t">' + esc(n.title) + '</span><span class="vn-chev" aria-hidden="true">→</span></a></li>').join("") + "</ul>";
  stage.appendChild(rootPanel);
  panels[-1] = rootPanel;

  tree.forEach((n) => {
    if (!n.count) return;
    const p = d.createElement("div");
    p.className = "vn-panel";
    p.dataset.node = n.i;
    p.innerHTML =
      '<a class="vn-open-page" href="' + esc(n.href) + '"' + cur(n.href) + "><div><b>" + esc(n.title) + "</b><span>" +
      (n.intro ? "Open the overview" : "Open the section page") + '</span></div><span class="vn-chev" aria-hidden="true">→</span></a>' +
      (n.intro ? '<p class="vn-gsub" style="margin-top:0">' + esc(n.intro) + "</p>" : "") +
      n.groups.map((g) => (g.title ? '<h3 class="vn-gtitle">' + esc(g.title) + "</h3>" : "") + (g.sub ? '<p class="vn-gsub">' + esc(g.sub) + "</p>" : "") +
        '<ul class="vn-list">' + g.items.map((it) => item(it, g.title ? "" : "vn-sm")).join("") + "</ul>").join("");
    stage.appendChild(p);
    panels[n.i] = p;
  });
  const results = d.createElement("div");
  results.className = "vn-panel";
  stage.appendChild(results);

  let level = -1, searching = false, pushed = false;
  function place(active) {
    [rootPanel, ...tree.filter((n) => n.count).map((n) => panels[n.i]), results].forEach((p) => {
      p.dataset.pos = p === active ? "here" : p === rootPanel ? "left" : "right";
      p.inert = p !== active;
    });
    if (active === rootPanel) rootPanel.dataset.pos = "here";
  }
  function renderCrumb() {
    const parts = ['<button type="button" data-vn-go="-1"' + (level === -1 && !searching ? ' aria-current="location"' : "") + ">Menu</button>"];
    if (searching) parts.push("<i>›</i><button type=\"button\" aria-current=\"location\">Search</button>");
    else if (level >= 0) parts.push("<i>›</i><button type=\"button\" aria-current=\"location\">" + esc(tree.find((n) => n.i === level).title) + "</button>");
    crumb.innerHTML = parts.join("");
  }
  function go(i, focus = true) {
    searching = false;
    if (input.value) input.value = "";
    level = i;
    place(panels[i]);
    if (i >= 0) panels[i].scrollTop = 0;
    renderCrumb();
    if (focus && !matchMedia("(hover: none)").matches) (panels[i].querySelector("a,button"))?.focus({ preventScroll: true });
  }
  function search(q) {
    q = q.trim().toLowerCase();
    if (!q) { go(level, false); return; }
    searching = true;
    const hits = [];
    tree.forEach((n) => {
      if (n.title.toLowerCase().includes(q)) hits.push({ title: n.title, href: n.href, path: "Section" });
      n.groups.forEach((g) => g.items.forEach((it) => {
        if ((it.title + " " + (it.sub || "")).toLowerCase().includes(q))
          hits.push({ title: it.title, href: it.href, num: it.num, path: n.title + (g.title ? " › " + g.title : "") });
      }));
    });
    results.innerHTML = hits.length
      ? '<ul class="vn-list">' + hits.map((h) => '<li><a class="vn-link" href="' + esc(h.href) + '"' + cur(h.href) + ">" + (h.num ? '<span class="vn-num">' + esc(h.num) + "</span>" : "") +
        '<span class="vn-t">' + esc(h.title) + '<span class="vn-path">' + esc(h.path) + '</span></span><span class="vn-chev" aria-hidden="true">→</span></a></li>').join("") + "</ul>"
      : '<p class="vn-empty">Nothing by that name yet.</p>';
    place(results);
    renderCrumb();
  }
  function openSheet(withSearch) {
    if (sheet.open) return;
    close();
    const start = tree.find((n) => n.count && n.contains(here) && canon(n.href) !== "/");
    root.style.setProperty("--vn-vw", root.clientWidth + "px");
    sheet.showModal();
    toggle.setAttribute("aria-expanded", "true");
    root.style.overflow = "hidden";
    go(start ? start.i : -1, false);
    try { history.pushState({ vnSheet: true }, ""); pushed = true; } catch (e) { pushed = false; }
    if (withSearch) input.focus();
    else sheet.querySelector("[data-vn-close]").focus({ preventScroll: true });
  }
  function closeSheet() { if (sheet.open) sheet.close(); }
  sheet.addEventListener("close", () => {
    toggle.setAttribute("aria-expanded", "false");
    root.style.overflow = "";
    if (pushed && history.state && history.state.vnSheet) { pushed = false; history.back(); }
  });
  addEventListener("popstate", () => { if (sheet.open) { pushed = false; sheet.close(); } });
  toggle.addEventListener("click", () => openSheet(false));
  sheet.addEventListener("click", (e) => {
    const g = e.target.closest("[data-vn-go]");
    if (g) { go(Number(g.dataset.vnGo)); return; }
    if (e.target.closest("[data-vn-close]")) closeSheet();
    const a = e.target.closest("a[href]");
    if (a) { pushed = false; sheet.close(); }
  });
  input.addEventListener("input", () => search(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { const first = results.querySelector("a"); if (searching && first) { e.preventDefault(); first.click(); } }
  });
  sheet.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && (level >= 0 || searching) && d.activeElement !== input) { e.preventDefault(); go(-1); }
    if (e.key === "Backspace" && d.activeElement !== input && level >= 0) { e.preventDefault(); go(-1); }
  });
  let sx = 0, sy = 0;
  stage.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (dx > 70 && Math.abs(dy) < 50 && (level >= 0 || searching)) go(-1);
  }, { passive: true });
  d.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(d.activeElement?.tagName) || d.activeElement?.isContentEditable;
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sheet.open ? input.focus() : openSheet(true); }
    else if (e.key === "/" && !typing && !sheet.open) { e.preventDefault(); openSheet(true); }
  });
  place(rootPanel);
  renderCrumb();
})();

/* ---------- Living header (desktop) ----------
   A dark header band with slow motion at its edges, kept faint behind the menu.
   Scenes: stars (constellations), koi, cloud (the archive's two spirals), off.
   ?header=koi in the address (or the small switch in the header corner) picks a scene and remembers it. */
(() => {
  "use strict";
  const d = document, root = d.documentElement;
  const header = d.querySelector(".cento-header");
  if (!header || !d.querySelector(".desktop-nav")) return;
  root.classList.add("vn-dark-head");
  const here = location.pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/";
  d.querySelectorAll(".desktop-nav .wsite-menu-default > li").forEach((li) => {
    const hrefs = [...li.querySelectorAll("a[href]")].map((a) => new URL(a.href).pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/");
    if (hrefs.includes(here) && !(here !== "/" && hrefs[0] === "/" && hrefs.length === 1)) li.classList.add("vn-here");
  });

  const KEY = "vn-header", MODES = ["stars", "koi", "cloud", "off"];
  let mode = new URLSearchParams(location.search).get("header");
  if (MODES.includes(mode)) { try { localStorage.setItem(KEY, mode); } catch (e) { /* storage unavailable */ } }
  else { try { mode = localStorage.getItem(KEY); } catch (e) { mode = null; } if (!MODES.includes(mode)) mode = "stars"; }

  const wide = matchMedia("(min-width: 993px)");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cv = d.createElement("canvas");
  cv.className = "vn-head-canvas";
  cv.setAttribute("aria-hidden", "true");
  header.prepend(cv);
  const ctx = cv.getContext("2d");
  let W = 0, H = 0, raf = 0, last = 0, onScreen = true, scene = null;
  const mouse = { x: -9999, y: -9999 };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;

  const switcher = d.createElement("div");
  switcher.className = "vn-head-modes";
  switcher.setAttribute("role", "group");
  switcher.setAttribute("aria-label", "Header animation");
  switcher.innerHTML = [["stars", "✦", "Constellations"], ["koi", "≈", "Koi"], ["cloud", "◌", "The archive cloud"], ["off", "·", "Still"]]
    .map(([m, g, t]) => '<button type="button" data-m="' + m + '" title="' + t + '" aria-label="' + t + '">' + g + "</button>").join("");
  header.appendChild(switcher);

  /* --- stars: drifting constellations with gold threads --- */
  const Stars = {
    init() {
      const n = Math.round(W / 13);
      this.p = Array.from({ length: n }, () => ({ x: rnd(0, W), y: rnd(0, H), vx: rnd(-.012, .012), vy: rnd(-.006, .006), r: rnd(.4, 1.5), ph: rnd(0, TAU), big: Math.random() < .06 }));
      this.shoot = null; this.next = 3000;
    },
    draw(t, dt) {
      const p = this.p;
      for (const s of p) {
        const dx = s.x - mouse.x, dy = s.y - mouse.y, dd = dx * dx + dy * dy;
        if (dd < 6400) { const f = (1 - dd / 6400) * .02; s.x += dx * f; s.y += dy * f; }
        s.x += s.vx * dt; s.y += s.vy * dt;
        if (s.x < -10) s.x = W + 10; if (s.x > W + 10) s.x = -10; if (s.y < -10) s.y = H + 10; if (s.y > H + 10) s.y = -10;
      }
      ctx.lineWidth = .6;
      for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) {
        const dx = p[i].x - p[j].x, dy = p[i].y - p[j].y, dd = dx * dx + dy * dy;
        if (dd < 8100) { ctx.strokeStyle = "rgba(216,180,106," + (1 - dd / 8100) * .32 + ")"; ctx.beginPath(); ctx.moveTo(p[i].x, p[i].y); ctx.lineTo(p[j].x, p[j].y); ctx.stroke(); }
      }
      for (const s of p) {
        const tw = .55 + .45 * Math.sin(t * .0016 + s.ph);
        if (s.big) { const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 9); g.addColorStop(0, "rgba(255,236,190," + .5 * tw + ")"); g.addColorStop(1, "rgba(255,236,190,0)"); ctx.fillStyle = g; ctx.fillRect(s.x - 9, s.y - 9, 18, 18); }
        ctx.fillStyle = "rgba(240,230,205," + (.35 + .55 * tw) + ")";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * (s.big ? 1.4 : 1), 0, TAU); ctx.fill();
      }
      this.next -= dt;
      if (!this.shoot && this.next < 0) { const left = Math.random() < .5; this.shoot = { x: left ? rnd(0, W * .2) : rnd(W * .8, W), y: rnd(5, H * .4), vx: (left ? 1 : -1) * rnd(.35, .5), vy: rnd(.08, .16), life: 1 }; }
      if (this.shoot) {
        const s = this.shoot; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt / 1400;
        const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 120, s.y - s.vy * 120);
        g.addColorStop(0, "rgba(255,240,210," + Math.max(0, s.life) + ")"); g.addColorStop(1, "rgba(255,240,210,0)");
        ctx.strokeStyle = g; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 120, s.y - s.vy * 120); ctx.stroke();
        if (s.life <= 0) { this.shoot = null; this.next = rnd(5000, 9000); }
      }
    },
  };

  /* --- koi: slow fish in dark water, with rings where they turn --- */
  const PALETTES = [
    { body: "#f2efe6", spots: ["#e2552c", "#d9461f"] },
    { body: "#ef7a2b", spots: ["#f6efe2"] },
    { body: "#e9b44c", spots: ["#f5d98c"] },
    { body: "#f1ece0", spots: ["#1b1b1f", "#d84a24"] },
    { body: "#c8462a", spots: ["#f3eee4", "#151518"] },
  ];
  const Koi = {
    init() {
      const n = Math.max(5, Math.round(W / 210));
      this.f = Array.from({ length: n }, (_, i) => {
        const side = i % 2 ? rnd(W * .8, W) : rnd(0, W * .2);
        return { x: side, y: rnd(30, H - 30), a: rnd(0, TAU), v: rnd(.022, .036), L: rnd(38, 58), ph: rnd(0, TAU), turn: rnd(-1, 1), pal: PALETTES[i % PALETTES.length],
          spots: Array.from({ length: 3 }, () => ({ u: rnd(.15, .75), w: rnd(-.5, .5), r: rnd(.18, .32) })) };
      });
      this.rings = [];
    },
    fish(k, t) {
      const n = 10, pts = [];
      const sw = Math.sin(t * .006 + k.ph);
      for (let i = 0; i <= n; i++) {
        const u = i / n, lat = Math.sin(t * .006 + k.ph - u * 2.4) * k.L * .12 * u * u;
        pts.push([k.L * (.5 - u), lat]);
      }
      const wd = (u) => k.L * .17 * Math.sin(Math.PI * Math.min(1, .12 + u * .95)) * (1 - u * .55);
      ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(k.a);
      ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(-2, 5, k.L * .45, k.L * .12, 0, 0, TAU); ctx.fill();
      const tail = pts[n];
      ctx.fillStyle = k.pal.body; ctx.globalAlpha = .55;
      ctx.beginPath(); ctx.moveTo(tail[0] + 3, tail[1]);
      ctx.quadraticCurveTo(tail[0] - k.L * .2, tail[1] - k.L * .2 + sw * 3, tail[0] - k.L * .3, tail[1] - k.L * .15 + sw * 5);
      ctx.quadraticCurveTo(tail[0] - k.L * .12, tail[1], tail[0] - k.L * .3, tail[1] + k.L * .15 + sw * 5);
      ctx.quadraticCurveTo(tail[0] - k.L * .2, tail[1] + k.L * .2 + sw * 3, tail[0] + 3, tail[1]); ctx.fill();
      ctx.globalAlpha = .5;
      for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.ellipse(pts[3][0], pts[3][1] + sgn * wd(.3) * 1.1, k.L * .1, k.L * .05, sgn * (.7 + sw * .2), 0, TAU); ctx.fill(); }
      ctx.globalAlpha = .92;
      ctx.beginPath();
      pts.forEach(([x, y], i) => { const w = wd(i / n); i ? ctx.lineTo(x, y - w) : ctx.moveTo(x, y - w); });
      for (let i = n; i >= 0; i--) { const [x, y] = pts[i]; ctx.lineTo(x, y + wd(i / n)); }
      ctx.closePath(); ctx.fill();
      ctx.save(); ctx.clip();
      k.spots.forEach((s, j) => { const i = Math.round(s.u * n), [x, y] = pts[i]; ctx.fillStyle = k.pal.spots[j % k.pal.spots.length]; ctx.beginPath(); ctx.ellipse(x, y + s.w * wd(s.u), k.L * s.r * .5, k.L * s.r * .32, 0, 0, TAU); ctx.fill(); });
      const g = ctx.createLinearGradient(0, -k.L * .2, 0, k.L * .2); g.addColorStop(0, "rgba(255,255,255,.18)"); g.addColorStop(.5, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(0,0,0,.25)");
      ctx.fillStyle = g; ctx.fillRect(-k.L, -k.L, k.L * 2, k.L * 2);
      ctx.restore(); ctx.restore(); ctx.globalAlpha = 1;
    },
    draw(t, dt) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "rgba(20,48,58,.35)"); g.addColorStop(1, "rgba(8,20,28,.15)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 6; i++) { const x = (i * 241 + t * .01) % (W + 200) - 100, y = (i * 53) % H; ctx.strokeStyle = "rgba(160,210,220,.05)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, 90, 18, .2, 0, TAU); ctx.stroke(); }
      this.rings = this.rings.filter((r) => (r.r += dt * .02, r.r < 40));
      for (const r of this.rings) { ctx.strokeStyle = "rgba(200,230,235," + (1 - r.r / 40) * .25 + ")"; ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r, r.r * .45, 0, 0, TAU); ctx.stroke(); }
      for (const k of this.f) {
        k.turn += rnd(-.02, .02); k.turn = Math.max(-1, Math.min(1, k.turn));
        let steer = k.turn * .0009;
        if (k.y < 26) steer += (Math.sin(k.a) < 0 ? (Math.cos(k.a) > 0 ? .004 : -.004) : 0);
        if (k.y > H - 26) steer += (Math.sin(k.a) > 0 ? (Math.cos(k.a) > 0 ? -.004 : .004) : 0);
        const dx = k.x - mouse.x, dy = k.y - mouse.y;
        if (dx * dx + dy * dy < 4900) { const want = Math.atan2(dy, dx); steer += Math.sin(want - k.a) * .01; if (Math.random() < .02) this.rings.push({ x: k.x, y: k.y, r: 2 }); }
        k.a += steer * dt;
        const v = k.v * (1 + .25 * Math.sin(t * .004 + k.ph));
        k.x += Math.cos(k.a) * v * dt; k.y += Math.sin(k.a) * v * dt;
        if (k.x < -60) k.x = W + 60; if (k.x > W + 60) k.x = -60;
        k.y = Math.max(10, Math.min(H - 10, k.y));
        if (Math.random() < .0008 * dt / 16) this.rings.push({ x: k.x + Math.cos(k.a) * k.L * .5, y: k.y + Math.sin(k.a) * k.L * .5, r: 2 });
        this.fish(k, t);
      }
    },
  };

  /* --- cloud: the archive's two spirals turning, with drifting biomes between --- */
  const Cloud = {
    init() {
      this.n = 140;
      this.orbs = Array.from({ length: 16 }, () => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(3, 9), vx: rnd(-.01, .01), vy: rnd(-.005, .005), c: ["216,180,106", "127,209,193", "150,160,255", "232,120,110", "200,230,150"][Math.floor(rnd(0, 5))], ph: rnd(0, TAU) }));
    },
    spiral(cx, col, t, dir) {
      const pts = [];
      for (let i = 0; i < this.n; i++) {
        const u = i / this.n, th = i * .32 + t * .0004 * dir;
        const R = H * (.18 + .2 * u);
        pts.push({ x: cx + R * Math.cos(th) * 1.25, y: H * .08 + u * H * .86, z: Math.sin(th) });
      }
      pts.sort((a, b) => a.z - b.z);
      for (const p of pts) { const a = .25 + .6 * (p.z + 1) / 2, r = .6 + 1.4 * (p.z + 1) / 2; ctx.fillStyle = "rgba(" + col + "," + a + ")"; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill(); }
      return pts;
    },
    draw(t, dt) {
      for (const o of this.orbs) {
        o.x += o.vx * dt; o.y += o.vy * dt;
        if (o.x < -20) o.x = W + 20; if (o.x > W + 20) o.x = -20; if (o.y < -20) o.y = H + 20; if (o.y > H + 20) o.y = -20;
        const pulse = 1 + .25 * Math.sin(t * .0012 + o.ph), R = o.r * 3 * pulse;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, R); g.addColorStop(0, "rgba(" + o.c + ",.55)"); g.addColorStop(.35, "rgba(" + o.c + ",.18)"); g.addColorStop(1, "rgba(" + o.c + ",0)");
        ctx.fillStyle = g; ctx.fillRect(o.x - R, o.y - R, R * 2, R * 2);
      }
      ctx.strokeStyle = "rgba(240,230,205,.12)"; ctx.lineWidth = 1; ctx.setLineDash([2, 6]);
      ctx.beginPath(); ctx.moveTo(W * .1, H * .55); ctx.bezierCurveTo(W * .35, H * (.1 + .05 * Math.sin(t * .0005)), W * .65, H * (.1 - .05 * Math.sin(t * .0005)), W * .9, H * .55); ctx.stroke(); ctx.setLineDash([]);
      this.spiral(W * .1, "216,180,106", t, 1);
      this.spiral(W * .9, "127,209,193", t, -1);
    },
  };

  const SCENES = { stars: Stars, koi: Koi, cloud: Cloud };
  function size() {
    const r = header.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (scene) scene.init();
  }
  function frame(t) {
    raf = 0;
    if (!scene || !wide.matches || !onScreen || d.hidden) return;
    const dt = Math.min(48, last ? t - last : 16); last = t;
    ctx.clearRect(0, 0, W, H);
    scene.draw(t, dt);
    if (!still) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && scene) { last = 0; raf = requestAnimationFrame(frame); } }
  function setMode(m) {
    mode = m;
    try { localStorage.setItem(KEY, m); } catch (e) { /* storage unavailable */ }
    switcher.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.m === m)));
    scene = SCENES[m] || null;
    ctx.clearRect(0, 0, W, H);
    if (scene) { scene.init(); kick(); }
  }
  switcher.addEventListener("click", (e) => { const b = e.target.closest("button[data-m]"); if (b) setMode(b.dataset.m); });
  header.addEventListener("pointermove", (e) => { const r = header.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  header.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
  new ResizeObserver(() => { size(); kick(); }).observe(header);
  new IntersectionObserver((en) => { onScreen = en[0].isIntersecting; kick(); }).observe(header);
  d.addEventListener("visibilitychange", kick);
  wide.addEventListener("change", kick);
  size();
  setMode(mode);
})();
