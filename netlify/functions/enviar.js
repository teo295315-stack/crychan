// Función auxiliar para convertir la clave VAPID
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Función principal para pedir permisos y suscribir
async function solicitarPermisoNotificaciones() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Este navegador no soporta notificaciones Push.');
        return;
    }

    const permiso = await Notification.requestPermission();
    
    if (permiso === 'granted') {
        console.log('Permiso concedido, suscribiendo al Service Worker...');
        const registro = await navigator.serviceWorker.ready;
        
        // Poner AQUÍ tu clave pública VAPID real entre comillas
        const vapidPublicKey = 'BIlgSBHIVVWwaypLTp8nSY0NFqxvRBZB1_p800UoShwkodKbF62xSlSFgf6idJ221HsIrzDug23cAUyCu71Cg_o'; 
        
        const suscripcion = await registro.pushManager.subscribe({
            userVisibleOnly: true, // OBLIGATORIO para Android/Chrome
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });

        // Enviar la nueva suscripción a tu backend en Netlify
        await fetch('/.netlify/functions/enviar', {
            method: 'POST',
            body: JSON.stringify(suscripcion),
            headers: { 'Content-Type': 'application/json' }
        });
    } else {
        console.log('El usuario denegó las notificaciones.');
    }
}