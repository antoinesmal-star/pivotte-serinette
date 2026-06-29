const CACHE_NAME = 'as-pivotte-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// ---- Notification quotidienne 18h (via Periodic Background Sync si dispo, sinon relais depuis la page) ----

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientsArr) => {
      const hadWindow = clientsArr.some((client) => {
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'OPEN_TRAINING' });
          return true;
        }
        return false;
      });
      if (!hadWindow && self.clients.openWindow) {
        return self.clients.openWindow('./index.html?tab=training');
      }
    })
  );
});

// Periodic background sync (Chrome/Android only, requires install + engagement)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-training-reminder') {
    event.waitUntil(showDailyReminder());
  }
});

// Fallback: regular sync event some browsers fire on reconnect
self.addEventListener('sync', (event) => {
  if (event.tag === 'daily-training-reminder') {
    event.waitUntil(showDailyReminder());
  }
});

async function showDailyReminder() {
  const drills = [
    "Conduite de balle en espace réduit",
    "Pressing à deux : déclenchement et couverture",
    "Gainage et explosivité — circuit 15 min",
    "Frappes enroulées : placement du pied d'appui",
    "Gérer la pression avant un match important"
  ];
  const drill = drills[Math.floor(Math.random() * drills.length)];
  return self.registration.showNotification("Séance du jour", {
    body: `À toi de jouer : ${drill}`,
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: 'daily-training',
    data: { url: './index.html?tab=training' }
  });
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_DAILY_REMINDER') {
    event.waitUntil(showDailyReminder());
  }
});
