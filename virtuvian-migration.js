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
