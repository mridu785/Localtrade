/* FCM requires this file at the site root and it must be a classic worker. */
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js");

/**
 * Duplicate the same public web configuration used in js/config/firebase-config.js.
 * These values are not secrets. Keep them in sync when you configure Firebase.
 */
firebase.initializeApp({
  apiKey: "AIzaSyAMfcQuS2dcSElu4l3PeezYQ_jJuffE9YQ",
  authDomain: "localsell-5ec5e.firebaseapp.com",
  projectId: "localsell-5ec5e",
  storageBucket: "localsell-5ec5e.firebasestorage.app",
  messagingSenderId: "574700712998",
  appId: "1:574700712998:web:4d926c5687062bbc85e2e7"
});

let messaging = null;
try { messaging = firebase.messaging(); } catch (err) { console.warn("FCM unavailable in service worker:", err); }

if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || "Axom Bazar";
    const options = {
      body: payload.notification?.body || "You have a new notification.",
      icon: "./assets/icons/icon.svg",
      badge: "./assets/icons/icon.svg",
      data: payload.data || {}
    };
    self.registration.showNotification(title, options);
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const target = data.chatId ? `./index.html#/chat/${encodeURIComponent(data.chatId)}` : "./index.html#/notifications";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const client of list) {
      if ("focus" in client) { client.navigate(target); return client.focus(); }
    }
    return clients.openWindow(target);
  }));
});