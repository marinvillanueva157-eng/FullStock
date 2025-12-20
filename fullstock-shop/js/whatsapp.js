/**
 * WhatsApp helper (wa.me)
 * Tu número local: 3764725830
 * Formato WhatsApp AR: 54 + 9 + número => 5493764725830
 */

(function () {
  const WHATSAPP_PHONE_RAW = "3764725830"; // tu número local

  function getWhatsAppPhone() {
    // Construye 549 + número local (Argentina)
    const local = String(WHATSAPP_PHONE_RAW).replace(/\D/g, "");
    const full = `549${local}`; // 54 (AR) + 9 + móvil + local
    return full.replace(/\D/g, "");
  }

  function sendWhatsAppMessage(message) {
    const phone = getWhatsAppPhone();
    if (!phone || phone.length < 10) {
      console.error("Número WhatsApp inválido:", phone);
      return;
    }

    const text = encodeURIComponent(String(message ?? ""));
    const url = `https://wa.me/${phone}?text=${text}`;

    // Intento 1: abrir nueva pestaña
    const win = window.open(url, "_blank", "noopener");

    // Si el navegador bloquea popups, caemos a redirección en la misma pestaña
    if (!win) window.location.href = url;
  }

  // IMPORTANTÍSIMO: hacerla global para que cart.js / product.js la vean siempre
  window.sendWhatsAppMessage = sendWhatsAppMessage;
})();
