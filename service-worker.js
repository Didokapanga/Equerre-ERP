self.addEventListener('install', function (event) {
    console.log('Service Worker installé');
    event.waitUntil(
        caches.open('v1').then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/manifest.json',
                '/icone-equerre.png',
                '/icone-equerre.png'
                // Ajoute d'autres fichiers ici si besoin
            ]);
        })
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
