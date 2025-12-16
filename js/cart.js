document.addEventListener('DOMContentLoaded', () => {
    const cartContainer = document.getElementById('cart-container');
    const cartActions = document.getElementById('cart-actions');
    
    // Verificar si estamos en la página del carrito
    if (!cartContainer) return;

    const renderCart = () => {
        const cartItems = window.cartService.get();
        const allProducts = window.products; // Asumiendo que products.js cargó antes

        cartContainer.innerHTML = '';
        cartActions.innerHTML = '';

        if (cartItems.length === 0) {
            cartContainer.innerHTML = `
                <div id="cart-empty-message">
                    <h2>Tu carrito está vacío</h2>
                    <p>¡Mirá nuestro catálogo y encontrá lo que buscás!</p>
                    <a href="shop.html" class="btn btn-primary">Ir a la Tienda</a>
                </div>
            `;
            return;
        }

        let total = 0;

        cartItems.forEach(item => {
            const product = allProducts.find(p => p.id === item.id);
            if (!product) return;

            const subtotal = product.price * item.quantity;
            total += subtotal;

            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="cart-item-img">
                    <img src="${product.images[0]}" alt="${product.title}">
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-title">${product.title}</div>
                    <div class="cart-item-price">${window.formatCurrency(product.price)}</div>
                </div>
                <div class="quantity-selector">
                    <button class="btn-qty" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <input type="number" value="${item.quantity}" min="1" onchange="updateQuantity(${item.id}, this.value)">
                    <button class="btn-qty" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <div class="cart-item-subtotal">
                    ${window.formatCurrency(subtotal)}
                </div>
                <div class="cart-item-actions">
                    <button onclick="removeItem(${item.id})" title="Eliminar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                </div>
            `;
            cartContainer.appendChild(itemElement);
        });

        // Acciones y Total
        cartActions.innerHTML = `
            <div id="cart-summary">
                <p>Total: <span id="cart-total">${window.formatCurrency(total)}</span></p>
                <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: flex-end;">
                    <button id="btn-clear-cart" class="btn btn-secondary" style="border-color: #ff4d4d; color: #ff4d4d;">Vaciar Carrito</button>
                    <button id="btn-checkout" class="btn btn-primary">Finalizar Compra por WhatsApp</button>
                </div>
            </div>
        `;

        // Event Listeners
        document.getElementById('btn-clear-cart').addEventListener('click', () => {
            if(confirm('¿Estás seguro de que querés vaciar el carrito?')) {
                window.cartService.clear();
                renderCart();
            }
        });

        document.getElementById('btn-checkout').addEventListener('click', () => {
             let message = "¡Hola! Quiero realizar el siguiente pedido:\n\n";
             cartItems.forEach(item => {
                 const product = allProducts.find(p => p.id === item.id);
                 if(product) {
                     message += `- ${product.title} x${item.quantity}: ${window.formatCurrency(product.price * item.quantity)}\n`;
                 }
             });
             message += `\nTotal: ${window.formatCurrency(total)}`;
             
             if (typeof sendWhatsAppMessage === 'function') {
                 sendWhatsAppMessage(message);
             } else {
                 alert('Error: whatsapp.js no cargado');
             }
        });
    };

    // Exponer funciones para onclick inline
    window.updateQuantity = (id, qty) => {
        window.cartService.update(id, qty);
        renderCart();
    };

    window.removeItem = (id) => {
        if(confirm('¿Eliminar este producto?')) {
            window.cartService.remove(id);
            renderCart();
        }
    };

    renderCart();
});