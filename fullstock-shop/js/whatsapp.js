// Por favor, reemplazá este número con tu número de WhatsApp real, incluyendo el código de país.
const WHATSAPP_PHONE = "549XXXXXXXXXX";

/**
 * Crea y abre un enlace de WhatsApp 'wa.me' con un mensaje predefinido.
 * @param {string} message - El mensaje a enviar.
 */
function sendWhatsAppMessage(message) {
    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}
