/**
 * Service Worker - Finansowy Tracker
 * Zapewnia offline functionality i cachowanie zasobów
 */

// Nazwa cache'u - zmień wersję, aby wymusić aktualizację
const CACHE_NAME = 'finansowy-tracker-v1.0.0';
const RUNTIME_CACHE = 'finansowy-tracker-runtime-v1.0.0';
const IMAGE_CACHE = 'finansowy-tracker-images-v1.0.0';

// Zasoby do cachowania przy instalacji Service Workera
const ASSETS_TO_CACHE = [
    '/myapp/',
    '/myapp/index.html',
    '/myapp/css/style.css',
    '/myapp/css/responsive.css',
    '/myapp/js/app.js',
    '/myapp/js/database.js',
    '/myapp/js/charts.js',
    '/myapp/js/notifications.js',
    '/myapp/manifest.json',
    '/myapp/icons/icon-192.png',
    '/myapp/icons/icon-512.png'
];

/**
 * Zdarzenie instalacji Service Workera
 * Cachuje podstawowe zasoby
 */
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Instalacja...');
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Cachowanie zasobów');
            return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
                console.log('[Service Worker] Błąd cachowania:', err);
                // Kontynuuj nawet jeśli niektóre zasoby się nie cachują
                return Promise.resolve();
            });
        })
    );
    
    // Wymusza aktywację nowego Service Workera
    self.skipWaiting();
});

/**
 * Zdarzenie aktywacji Service Workera
 * Usuwa stare cache'e
 */
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Aktywacja...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Usuwa stare cache'e
                    if (cacheName !== CACHE_NAME && 
                        cacheName !== RUNTIME_CACHE && 
                        cacheName !== IMAGE_CACHE) {
                        console.log('[Service Worker] Usuwanie cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Kontroluje wszystkie klienty natychmiast
    self.clients.claim();
});

/**
 * Zdarzenie pobierania zasobów
 * Strategia: Cache first, fallback to network
 * Dla API: Network first, fallback to cache
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Pomijaj żądania z innego pochodzenia
    if (url.origin !== location.origin) {
        return;
    }
    
    // Dla zasobów statycznych (CSS, JS, PNG, SVG) - cache first
    if (request.method === 'GET' && 
        (request.destination === 'style' || 
         request.destination === 'script' || 
         request.destination === 'image')) {
        event.respondWith(cacheFirst(request));
    }
    // Dla HTML - network first
    else if (request.method === 'GET' && request.destination === 'document') {
        event.respondWith(networkFirst(request));
    }
    // Dla pozostałych GET żądań - network first
    else if (request.method === 'GET') {
        event.respondWith(networkFirst(request));
    }
    // Dla POST, PUT, DELETE - network only
    else {
        event.respondWith(networkOnly(request));
    }
});

/**
 * Strategia Cache First
 * Najpierw sprawdza cache, jeśli nie ma - pobiera z sieci
 */
async function cacheFirst(request) {
    try {
        // Sprawdź cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('[Service Worker] Cache HIT:', request.url);
            return cachedResponse;
        }
        
        // Pobierz z sieci jeśli nie ma w cache
        console.log('[Service Worker] Cache MISS - pobieranie z sieci:', request.url);
        const networkResponse = await fetch(request);
        
        // Cachuj odpowiedź
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[Service Worker] Błąd cache first:', error);
        
        // Fallback - spróbuj cache jako ostatnią opcję
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Zwróć offline response
        return offlineResponse();
    }
}

/**
 * Strategia Network First
 * Najpierw próbuje sieć, fallback na cache
 */
async function networkFirst(request) {
    try {
        // Pobierz z sieci
        console.log('[Service Worker] Network request:', request.url);
        const networkResponse = await fetch(request);
        
        // Cachuj odpowiedź
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[Service Worker] Błąd network first, sprawdzam cache:', error);
        
        // Fallback na cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('[Service Worker] Użycie cached response:', request.url);
            return cachedResponse;
        }
        
        // Zwróć offline response
        return offlineResponse();
    }
}

/**
 * Strategia Network Only
 * Tylko żądania sieciowe, nie cachuje
 */
async function networkOnly(request) {
    try {
        return await fetch(request);
    } catch (error) {
        console.log('[Service Worker] Błąd network only:', error);
        return offlineResponse();
    }
}

/**
 * Generuje offline response
 * Zwraca HTML offline message
 */
function offlineResponse() {
    return new Response(
        `<!DOCTYPE html>
        <html lang="pl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Offline</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    background: #f5f5f5;
                }
                .offline-message {
                    text-align: center;
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .offline-message h1 {
                    color: #e74c3c;
                    margin-top: 0;
                }
                .offline-message p {
                    color: #666;
                    line-height: 1.6;
                }
            </style>
        </head>
        <body>
            <div class="offline-message">
                <h1>📡 Jesteś offline</h1>
                <p>Połączenie internetowe jest niedostępne.</p>
                <p>Aplikacja działa w trybie offline - twoje dane są zapisywane lokalnie.</p>
                <p>Spróbuj przeładować stronę, gdy połączenie się odnowi.</p>
            </div>
        </body>
        </html>`,
        {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'text/html; charset=utf-8',
            }),
        }
    );
}

/**
 * Message Handler - komunikacja między SW a aplikacją
 */
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Wiadomość:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then((cacheNames) => {
            cacheNames.forEach((cacheName) => {
                caches.delete(cacheName);
            });
        });
    }
    
    if (event.data && event.data.type === 'CACHE_ASSETS') {
        caches.open(CACHE_NAME).then((cache) => {
            cache.addAll(event.data.assets).catch((err) => {
                console.log('[Service Worker] Błąd cachowania assets:', err);
            });
        });
    }
});

/**
 * Periodyczne odświeżanie cache'u
 * Sprawdza aktualizacje co 24 godziny
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CHECK_UPDATE') {
        checkForUpdates();
    }
});

async function checkForUpdates() {
    console.log('[Service Worker] Sprawdzanie aktualizacji...');
    try {
        const response = await fetch('/myapp/manifest.json');
        if (response.ok) {
            console.log('[Service Worker] Manifest zaktualizowany');
        }
    } catch (error) {
        console.log('[Service Worker] Błąd sprawdzania aktualizacji:', error);
    }
}

/**
 * Background Sync - synchronizacja w tle
 * Próbuje zsynchronizować dane gdy połączenie się pojawi
 */
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background Sync:', event.tag);
    
    if (event.tag === 'sync-transactions') {
        event.waitUntil(syncTransactions());
    }
});

async function syncTransactions() {
    console.log('[Service Worker] Synchronizacja transakcji...');
    // W przyszłości można tutaj wysłać dane na serwer
    return Promise.resolve();
}

/**
 * Push Notifications
 */
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push notification:', event);
    
    if (!event.data) {
        return;
    }
    
    const options = {
        body: event.data.text(),
        icon: '/myapp/icons/icon-192.png',
        badge: '/myapp/icons/icon-96.png',
        tag: 'notification',
        requireInteraction: false,
    };
    
    event.waitUntil(
        self.registration.showNotification('Finansowy Tracker', options)
    );
});

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click:', event);
    
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // Sprawdź czy już jest otwarte okno
            for (let client of clientList) {
                if (client.url === '/myapp/' && 'focus' in client) {
                    return client.focus();
                }
            }
            // Jeśli nie, otwórz nowe
            if (clients.openWindow) {
                return clients.openWindow('/myapp/');
            }
        })
    );
});

console.log('[Service Worker] Skrypt załadowany');
