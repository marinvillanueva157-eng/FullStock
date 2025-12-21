document.addEventListener('DOMContentLoaded', async () => {
  const cartContainer = document.getElementById('cart-container');
  const cartActionsContainer = document.getElementById('cart-actions');

  // Seguridad: si este script se carga por error en otra página, no rompe nada
  if (!cartContainer || !cartActionsContainer) return;

  const fmt = (n) => window.formatCurrency ? window.formatCurrency(n) : `$ ${Number(n||0).toLocaleString('es-AR')}`;

  async function loadProductsIndex() {
    let products = [];
    let overrides = {};

    try {
      const r = await fetch('data/products.generated.json', { cache: 'no-store' });
      products = r.ok ? await r.json() : [];
    } catch (e) {
      console.error('No se pudo cargar products.generated.json', e);
      products = [];
    }

    try {
      const r = await fetch('data/product.overrides.json', { cache: 'no-store' });
      overrides = r.ok ? await r.json() : {};
    } catch {
      overrides = {};
    }

    const index = {};
    (products || []).forEach(p => {
      const key = p?.id || p?.slug;
      if (!key) return;
      const ov = (overrides && overrides[key]) ? overrides[key] : {};
      const merged = { ...p, ...ov };
      merged.price = Number(merged.price) || 0;
      merged.stock = Number(merged.stock) || 0;
      index[key] = merged;
    });

    console.log('Carrito: productos indexados =', Object.keys(index).length);
    return index;
  }

  function getCart() {
    const service = window.cartService;
    let cart = [];
    try {
      cart = service?.get ? service.get() : (JSON.parse(localStorage.getItem('fullstock_cart')) || []);
    } catch {
      cart = [];
    }
    if (!Array.isArray(cart)) cart = [];
    // Normalizar
    cart = cart.map(it => ({
      id: String(it.id ?? it.productId ?? '').trim(),
      quantity: Number(it.quantity ?? it.qty ?? 1) || 1
    })).filter(it => it.id);
    console.log('Carrito: items =', cart.length, cart);
    return cart;
  }

  function setCart(newCart) {
    if (window.cartService?.set) window.cartService.set(newCart);
    else localStorage.setItem('fullstock_cart', JSON.stringify(newCart));
    if (window.cartService?.count) window.cartService.count(); // actualiza header
  }

  function renderEmpty() {
    cartContainer.innerHTML = `
      <div id="cart-empty-message">
        <p>Tu carrito está vacío.</p>
        <a href="shop.html" class="btn btn-primary">Ir a la tienda</a>
      </div>`;
    cartActionsContainer.innerHTML = '';
  }

  function render(cart, productIndex) {
    if (!cart.length) {
      renderEmpty();
      return;
    }

    let total = 0;
    let html = '';

    cart.forEach(item => {
      const p = productIndex[item.id];
      if (!p) {
        console.warn('Producto no encontrado:', item.id);
        html += `
          <div class="cart-item">
            <div class="cart-item-info">
              <p class="cart-item-title">Producto no encontrado (ID: ${item.id})</p>
              <p class="cart-item-price">Unitario: ${fmt(0)}</p>
            </div>
            <p class="cart-item-subtotal">Subtotal: ${fmt(0)}</p>
            <div class="cart-item-actions">
              <button class="remove-item-btn" data-id="${item.id}">&times;</button>
            </div>
          </div>`;
        return;
      }

      const unit = Number(p.price) || 0;
      const qty = Math.max(1, Number(item.quantity) || 1);
      const subtotal = unit * qty;
      total += subtotal;

      html += `
        <div class="cart-item">
          <div class="cart-item-info">
            <p class="cart-item-title">${p.title}</p>
            <p class="cart-item-price">Unitario: ${fmt(unit)}</p>
            <div class="quantity-selector">
              <input type="number" class="cart-item-quantity"
                     data-id="${item.id}" value="${qty}" min="1"
                     ${p.stock > 0 ? `max="${p.stock}"` : ''}>
            </div>
          </div>
          <p class="cart-item-subtotal">Subtotal: ${fmt(subtotal)}</p>
          <div class="cart-item-actions">
            <button class="remove-item-btn" data-id="${item.id}">&times;</button>
          </div>
        </div>`;
    });

    cartContainer.innerHTML = html;

    cartActionsContainer.innerHTML = `
      <div id="cart-summary">
        <h3>Total: <span id="cart-total">${fmt(total)}</span></h3>
        <button id="clear-cart-btn" class="btn btn-secondary">Vaciar Carrito</button>
      </div>

      <form id="checkout-form">
        <h2>Finalizar Compra</h2>

        <div class="form-group">
          <label for="name">Nombre y Apellido</label>
          <input type="text" id="name" required>
        </div>

        <div class="form-group">
          <label for="address">Zona / Barrio</label>
          <input type="text" id="address" required>

          <label for="addressInput">Ubicación / Dirección (autocompletado)</label>

          <!-- ✅ CAMBIO MÍNIMO: input + botón al lado -->
          <div style="display:flex; gap:10px; align-items:center;">
            <input id="addressInput" type="text"
                   placeholder="Escribí tu barrio, calle y ciudad..."
                   autocomplete="off" style="flex:1;" />
            <button type="button" id="use-location-btn" class="btn btn-secondary">
              Usar mi ubicación
            </button>
          </div>

          <!-- ✅ CAMBIO MÍNIMO: status -->
          <small id="gpsStatus" style="display:block; margin-top:8px; opacity:0.85;"></small>

          <div id="addressSuggestions" class="suggestions"></div>

          <input id="addressChosen" type="hidden" />
          <input id="addressLat" type="hidden" />
          <input id="addressLon" type="hidden" />
        </div>

        <div class="form-group">
          <label for="delivery">Forma de Entrega</label>
          <select id="delivery" required>
            <option value="Retiro">Retirar en punto de entrega</option>
            <option value="Envio">Solicitar envío (a coordinar)</option>
          </select>
        </div>

        <button type="submit" class="btn btn-primary">Finalizar por WhatsApp</button>
      </form>
    `;

    // Inicializar el autocompletado ahora que el input existe en el DOM
    if (window.initLocationAutocomplete) window.initLocationAutocomplete();

    // ✅ CAMBIO MÍNIMO: Botón "Usar mi ubicación" (GPS) sin API externa
    const useBtn = document.getElementById('use-location-btn');
    const gpsStatus = document.getElementById('gpsStatus');

    useBtn?.addEventListener('click', () => {
      if (!('geolocation' in navigator)) {
        alert('Tu navegador no soporta ubicación.');
        return;
      }

      useBtn.disabled = true;
      if (gpsStatus) gpsStatus.textContent = 'Pidiendo permiso de ubicación…';

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          // Guardar coords en hidden inputs ya existentes
          const latEl = document.getElementById('addressLat');
          const lonEl = document.getElementById('addressLon');
          if (latEl) latEl.value = String(lat);
          if (lonEl) lonEl.value = String(lon);

          // Escribir algo útil en el input si está vacío
          const input = document.getElementById('addressInput');
          if (input && !input.value.trim()) {
            input.value = 'Ubicación detectada (GPS)';
          }

          if (gpsStatus) gpsStatus.textContent = 'Ubicación cargada ✅';

          // “Cerrar” el botón luego de usarlo
          useBtn.style.display = 'none';
        },
        (err) => {
          console.warn('GPS error:', err);
          if (gpsStatus) gpsStatus.textContent = 'No se pudo obtener ubicación. Revisá permisos.';
          useBtn.disabled = false;
          alert('No se pudo obtener tu ubicación. Verificá permisos de ubicación.');
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });

    // Events
    document.querySelectorAll('.cart-item-quantity').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = String(e.target.dataset.id);
        const quantity = Number(e.target.value) || 1;
        const next = cart.map(it => it.id === id ? { ...it, quantity } : it);
        setCart(next);
        render(next, productIndex);
      });
    });

    document.querySelectorAll('.remove-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = String(e.currentTarget.dataset.id);
        const next = cart.filter(it => it.id !== id);
        setCart(next);
        render(next, productIndex);
      });
    });

    document.getElementById('clear-cart-btn')?.addEventListener('click', () => {
      setCart([]);
      renderEmpty();
    });

    document.getElementById('checkout-form')?.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const address = document.getElementById('address').value.trim();
      const delivery = document.getElementById('delivery').value;

      const addressText =
        document.getElementById('addressChosen')?.value?.trim() ||
        document.getElementById('addressInput')?.value?.trim() ||
        "";

      const lat = document.getElementById('addressLat')?.value || "";
      const lon = document.getElementById('addressLon')?.value || "";

      let message = `¡Hola! Quiero finalizar mi pedido en FullStock Shop.\n\n`;
      message += `Cliente: ${name}\n`;
      message += `Zona/Barrio: ${address}\n`;
      if (addressText) message += `Ubicación: ${addressText}\n`;
      message += `Entrega: ${delivery}\n`;

      if (lat && lon) {
        message += `Mapa: https://www.google.com/maps?q=${lat},${lon}\n`;
      }

      message += `\nResumen del pedido:\n`;

      cart.forEach(it => {
        const p = productIndex[it.id];
        if (p) {
          const st = (Number(p.price)||0) * (Number(it.quantity)||1);
          message += `- ${p.title} (x${it.quantity}) — ${fmt(st)}\n`;
        }
      });

      message += `\nTotal: ${fmt(total)}`;

      if (typeof window.sendWhatsAppMessage === 'function') {
        window.sendWhatsAppMessage(message);
      } else {
        alert("Error: no se encontró sendWhatsAppMessage. Revisá carga de whatsapp.js");
        return;
      }

      setCart([]);
      renderEmpty();
    });
  }

  const productIndex = await loadProductsIndex();
  const cart = getCart();
  render(cart, productIndex);
});
