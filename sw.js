// Service Worker para Web Push Nativo
self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : { title: 'CryChan', body: '¡Te han respondido!' };
    
    const options = {
        body: data.body,
        icon: 'https://i.postimg.cc/gJNBDbDC/Captura-de-pantalla-2026-03-02-171058.png',
        badge: 'https://i.postimg.cc/gJNBDbDC/Captura-de-pantalla-2026-03-02-171058.png',
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});