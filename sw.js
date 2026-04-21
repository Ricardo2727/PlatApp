const CACHE = 'platapp-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/js/config.js',
  '/js/state.js',
  '/js/db.js',
  '/js/auth.js',
  '/js/navigation.js',
  '/js/dashboard.js',
  '/js/gastos.js',
  '/js/presupuesto.js',
  '/js/informe.js',
  '/js/ui.js',
  '/icons/icon.svg',
];

// Instalar: guardar archivos en caché
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activar: limpiar cachés viejas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first para assets propios, network-first para Supabase
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Supabase y APIs externas: siempre red
  if (url.hostname.includes('supabase.co') || url.hostname.includes('anthropic.com') || url.hostname.includes('googleapis.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Assets propios: cache-first, fallback a red
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
