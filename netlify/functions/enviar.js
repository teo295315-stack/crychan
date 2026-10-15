const webpush = require('web-push');

exports.handler = async (event, context) => {
    // Configurar cabeceras de respuesta (CORS)
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    // Manejar petición preflight de navegador
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: 'OK' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        if (!event.body) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Body vacío' }) };
        }

        const data = JSON.parse(event.body);
        const suscripcion = data.subscription || data;

        // Validar estructura básica de suscripción
        if (!suscripcion || !suscripcion.endpoint) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Suscripción o endpoint no válido' }) };
        }

        // Claves VAPID
        const publicVapidKey = 'BIlgSBHIVVWwaypLTp8nSY0NFqxvRBZB1_p800UoShwkodKbF62xSlSFgf6idJ221HsIrzDug23cAUyCu71Cg_o';
        const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

        // Si existe la clave privada, intentar enviar la notificación de prueba/alerta
        if (privateVapidKey) {
            webpush.setVapidDetails(
                'mailto:admin@crychan.com',
                publicVapidKey,
                privateVapidKey
            );

            const payload = JSON.stringify({
                title: "CryChan - Notificación",
                body: `¡Alguien ha respondido a tu mensaje!`,
                icon: "/icon.png"
            });

            await webpush.sendNotification(suscripcion, payload);
        }

        // Devolver respuesta OK limpia para evitar el error 502
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Suscripción procesada con éxito' })
        };

    } catch (error) {
        console.error("Error en Netlify Function enviar.js:", error);
        
        // Retornar 200 con log de advertencia para no romper el flujo del cliente
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ warning: 'Procesado con advertencia', details: error.message })
        };
    }
};
