/**
 * WhatsApp redirect (wa.me)
 * Número Argentina: 54 + 9 + número local
 * Tu número local: 3764725830  => wa.me: 5493764725830
 */

const WHATSAPP_PHONE = "5493764725830";

/**
 * Abre WhatsApp con el mensaje indicado.
 * @param {string} message
 */
function sendWhatsAppMessage(message) {
  const phone = String(WHATSAPP_PHONE).replace(/\D/g, "");
  if (!phone) {
    console.error("Número de WhatsApp inválido:", WHATSAPP_PHONE);
    return;
  }

  const text = encodeURIComponent(String(message || ""));
  const url = `https://wa.me/${phone}?text=${text}`;

  window.open(url, "_blank", "noopener");
}

/**
 * Helper: arma el mensaje desde un carrito (opcional).
 * @param {Array<{title:string, qty:number, price:number}>} items
 * @param {number} total
 */
function buildCartMessage(items, total) {
  const lines = [];
  lines.push("Hola! Quiero hacer este pedido:");
  lines.push("");

  for (const it of (items || [])) {
    const name = it?.title ?? "Producto";
    const qty = Number(it?.qty ?? 1);
    const price = Number(it?.price ?? 0);
    const subtotal = qty * price;
    lines.push(`- ${name} x${qty} ($${subtotal})`);
  }

  lines.push("");
  lines.push(`Total: $${Number(total ?? 0)}`);
  return lines.join("\n");
}