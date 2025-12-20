/**
 * Crea y abre un enlace de WhatsApp 'wa.me' con un mensaje predefinido.
 * @param {string} message - El mensaje a enviar.
 */
function sendWhatsAppMessage(message) {
    if (typeof WHATSAPP_PHONE === "undefined") {
        console.error("WHATSAPP_PHONE no está definido");
        return;
    }

    // Limpia el número: deja SOLO dígitos
    const phone = String(3764725830).replace(/\D/g, "");

    if (!phone) {
        console.error("Número de WhatsApp inválido:", WHATSAPP_PHONE);
        return;
    }

    const text = encodeURIComponent(message);
    const url = `https://wa.me/${phone}?text=${text}`;

    window.open(url, "_blank", "noopener");
}
