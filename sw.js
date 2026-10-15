self.addEventListener('push', function(event) {
    let data = { title: 'CryChan', body: '¡Tienes una nueva respuesta!' };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: '/icon.png',       // Asegúrate de tener una imagen o cámbiala por la tuya
        badge: '/icon.png',      // Icono pequeño para la barra superior de Android
        vibrate: [200, 100, 200], // Hace vibrar el teléfono
        data: {
            url: data.url || '/'
        }
    };

    // Obliga al sistema operativo a mostrar la notificación antes de cerrar el proceso
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Al pulsar la notificación, abre la web
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});