const CACHE_NAME = 'winston-pet-v4';
const ASSETS = [
  './',
  './index.html',
  './renderer.js',
  './assets/idle.png',
  './assets/walk1.png',
  './assets/walk2.png',
  './assets/sleep.png',
  './assets/happy.png',
  './assets/eat.png',
  './assets/drag.png',
  './assets/ball.png',
  './assets/highfive.png',
  './assets/liedown.png',
  './assets/beg.png',
  './assets/bath.png',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
