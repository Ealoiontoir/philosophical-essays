const mobileNavigation = document.querySelector(".mobile-nav");
const hamburger = document.querySelector(".cento-header .hamburger");

function setMenuOpen(open) {
  document.body.classList.toggle("nav-open", open);
  hamburger?.setAttribute("aria-expanded", String(open));
}

if (hamburger && mobileNavigation) {
  hamburger.setAttribute("aria-expanded", "false");
  hamburger.addEventListener("click", (event) => {
    event.preventDefault();
    setMenuOpen(!document.body.classList.contains("nav-open"));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("nav-open")) {
      setMenuOpen(false);
      hamburger.focus();
    }
  });
  for (const submenu of mobileNavigation.querySelectorAll(".wsite-menu-wrap")) {
    const link = submenu.parentElement.querySelector(":scope > a");
    if (!link) continue;
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "virtuvian-submenu-toggle";
    toggle.textContent = "+";
    toggle.setAttribute("aria-label", `Subpages for ${link.textContent.trim()}`);
    toggle.setAttribute("aria-expanded", "false");
    submenu.dataset.virtuvianOpen = "false";
    toggle.addEventListener("click", () => {
      const open = submenu.dataset.virtuvianOpen !== "true";
      submenu.dataset.virtuvianOpen = String(open);
      submenu.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "−" : "+";
    });
    link.after(toggle);
  }
}
