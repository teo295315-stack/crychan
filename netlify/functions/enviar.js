const webpush = require('web-push');

webpush.setVapidDetails(
    'mailto:litimalia33@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    try {
        const { subscription, autorNombre } = JSON.parse(event.body);
        const payload = JSON.stringify({
            title: '💬 CryChan',
            body: `${autorNombre} ha respondido a tu mensaje.`
        });
        
        await webpush.sendNotification(subscription, payload);
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } catch (error) {
        console.error("Error enviando push nativo:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};