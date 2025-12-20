/**
 * Abre WhatsApp usando wa.me con un mensaje predefinido.
 */

// CONFIGURACIÓN
const WHATSAPP_PHONE = "5493764725830"; // 54 (AR) + 9 + TU número

function sendWhatsAppMessage(message) {
    const phone = String(WHATSAPP_PHONE).replace(/\D/g, "");

    if (!phone) {
        console.error("Número de WhatsApp inválido:", WHATSAPP_PHONE);
        return;
    }

    const text = encodeURIComponent(message);
    const url = `https://wa.me/${phone}?text=${text}`;

    window.open(url, "_blank", "noopener");
}
