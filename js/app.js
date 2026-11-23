import { configured } from "./firebase/firebase-init.js";
import { initAuth, authReady, subscribeAuth, getCurrentUser } from "./firebase/auth.js";
import { initAppCheck } from "./firebase/app-check.js";
import { startRouter, refreshRoute } from "./router.js";
import { renderNavbar } from "./components/navbar.js";
import { renderBottomNav } from "./components/bottom-nav.js";
import { initInstallPrompt } from "./components/install.js";
import { showToast } from "./components/toast.js";
import { toggleFavourite } from "./features/favourites.js";

function renderConfigRequired() {
  document.getElementById("boot-loader")?.remove();
  document.getElementById("app-header").innerHTML = "";
  document.getElementById("bottom-nav").innerHTML = "";
  document.getElementById("app").innerHTML = `<div class="page"><div class="container" style="max-width:720px">
    <div class="card"><div class="card-body">
      <h1 style="margin-bottom:10px">Firebase configuration required</h1>
      <p class="text-sm muted" style="line-height:1.7">Open <code>js/config/firebase-config.js</code> and replace the <code>REPLACE_</code> placeholders with your Firebase web app configuration, App Check site key, Cloudflare Worker URL and FCM VAPID key. Then reload this page.</p>
      <div class="divider"></div>
      <p class="text-sm">Follow <code>README.md</code> and <code>firebase/README.md</code> for setup, rules and indexes. No Firebase credentials are included in this repository.</p>
    </div></div>
  </div></div>`;
}

async function bootstrap() {
  if (!configured) { renderConfigRequired(); return; }

  initAppCheck();
  initInstallPrompt();
  initAuth();

  await authReady;

  renderNavbar();
  renderBottomNav("home");
  startRouter();

  let lastUid = getCurrentUser()?.uid || null;
  subscribeAuth((user) => {
    const uid = user?.uid || null;
    if (uid === lastUid) return;
    lastUid = uid;
    renderNavbar();
    refreshRoute();
  });

  document.addEventListener("location:changed", () => {
    renderNavbar();
    refreshRoute();
  });

  window.addEventListener("online", () => {
    document.getElementById("offline-banner").hidden = true;
    showToast("Back online.", "success");
  });
  window.addEventListener("offline", () => {
    document.getElementById("offline-banner").hidden = false;
  });

  document.addEventListener("click", async (event) => {
    const favBtn = event.target.closest("[data-fav]");
    if (favBtn) {
      event.preventDefault();
      event.stopPropagation();
      await toggleFavourite(favBtn.dataset.fav, favBtn);
    }
  });

  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            showToast("A new version is available. Refresh to update.", "info", 8000);
          }
        });
      });
    } catch (err) {
      console.warn("Service worker registration failed:", err.message);
    }
  }
}

bootstrap().catch((err) => {
  console.error("Bootstrap failed:", err);
  const app = document.getElementById("app");
  if (app) app.innerHTML = `<div class="page container"><div class="empty"><h3>Application failed to start</h3><p>${String(err.message || "").replace(/[<>&]/g, "")}</p></div></div>`;
});