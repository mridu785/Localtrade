const routes = [
  { path: /^\/$/, name: "home", load: () => import("./views/home.js") },
  { path: /^\/search$/, name: "search", load: () => import("./views/search.js") },
  { path: /^\/categories$/, name: "categories", load: () => import("./views/categories.js") },
  { path: /^\/listing\/([^/]+)$/, name: "listing", load: () => import("./views/listing.js") },
  { path: /^\/sell$/, name: "sell", auth: true, load: () => import("./views/sell.js") },
  { path: /^\/favourites$/, name: "favourites", auth: true, load: () => import("./views/favourites.js") },
  { path: /^\/chats$/, name: "chats", auth: true, load: () => import("./views/chats.js") },
  { path: /^\/chat\/([^/]+)$/, name: "chat", auth: true, load: () => import("./views/chat.js") },
  { path: /^\/profile$/, name: "profile", auth: true, load: () => import("./views/profile.js") },
  { path: /^\/user\/([^/]+)$/, name: "public-profile", load: () => import("./views/profile.js") },
  { path: /^\/my-listings$/, name: "my-listings", auth: true, load: () => import("./views/my-listings.js") },
  { path: /^\/notifications$/, name: "notifications", auth: true, load: () => import("./views/notifications.js") },
  { path: /^\/settings$/, name: "settings", load: () => import("./views/settings.js") },
  { path: /^\/auth$/, name: "auth", load: () => import("./views/auth.js") },
  { path: /^\/help$/, name: "help", load: () => import("./views/help.js") },
  { path: /^\/privacy$/, name: "privacy", load: () => import("./views/legal.js") },
  { path: /^\/terms$/, name: "terms", load: () => import("./views/legal.js") }
];

let current = null;
let currentCleanup = null;
let started = false;

function parseHash() {
  const raw = location.hash.replace(/^#/, "") || "/";
  const [path, search = ""] = raw.split("?");
  return { path: path || "/", query: new URLSearchParams(search), raw: raw || "/" };
}

function match(path) {
  for (const route of routes) {
    const m = path.match(route.path);
    if (m) return { route, params: m.slice(1) };
  }
  return null;
}

export function navigate(to, { replace = false } = {}) {
  const target = `#${String(to).replace(/^#/, "")}`;
  if (replace) history.replaceState(null, "", target);
  else location.hash = target;
}

export async function renderRoute() {
  const { path, query, raw } = parseHash();
  const matched = match(path);
  const app = document.getElementById("app");

  if (!matched) {
    const mod = await import("./views/not-found.js");
    app.innerHTML = mod.render({ query, path }).html;
    return;
  }

  const { route, params } = matched;

  if (route.auth) {
    const { getCurrentUser } = await import("./firebase/auth.js");
    if (!getCurrentUser()) {
      navigate(`/auth?next=${encodeURIComponent(raw)}`, { replace: true });
      return;
    }
  }

  if (currentCleanup) {
    try { currentCleanup(); } catch (e) { console.error(e); }
    currentCleanup = null;
  }

  try {
    const mod = await route.load();
    const view = mod.default || mod;
    const ctx = { query, params, path, name: route.name, raw };
    const result = await view.render(ctx);
    app.innerHTML = result.html;
    window.scrollTo({ top: 0, behavior: "instant" });
    if (result.mount) {
      const cleanup = await result.mount(app, ctx);
      if (typeof cleanup === "function") currentCleanup = cleanup;
    }
    current = { route, ctx };
    document.dispatchEvent(new CustomEvent("route:rendered", { detail: { name: route.name, ctx } }));
    const { renderBottomNav } = await import("./components/bottom-nav.js");
    renderBottomNav(route.name);
    const { track } = await import("./services/analytics-service.js");
    track("page_view", { page_title: route.name });
  } catch (err) {
    console.error("Route render failed:", err);
    app.innerHTML = `<div class="page container"><div class="empty">
      <h3>This page could not load</h3>
      <p>${String(err.message || "Unexpected error").replace(/[<>&]/g, "")}</p>
      <a class="btn btn-primary" href="#/">Go home</a>
    </div></div>`;
  }
}

export function refreshRoute() { return renderRoute(); }

export function startRouter() {
  if (started) return;
  started = true;
  window.addEventListener("hashchange", renderRoute);
  if (!location.hash) history.replaceState(null, "", "#/");
  renderRoute();
}

export function currentRoute() { return current; }