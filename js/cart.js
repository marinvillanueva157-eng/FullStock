document.addEventListener('DOMContentLoaded', () => {
    const cartContainer = document.getElementById('cart-container');
    const cartActionsContainer = document.getElementById('cart-actions');
    const allProducts = window.products || [];
    let cart = window.cartService.get();

    const updateCart = (newCart) => {
        cart = newCart;
        localStorage.setItem('fullstock_cart', JSON.stringify(cart));
        window.cartService.count(); // Para actualizar el header
        renderCart();
    };

    const renderCart = () => {
        if (cart.length === 0) {
            cartContainer.innerHTML = `
                <div id="cart-empty-message">
                    <p>Tu carrito está vacío.</p>
                    <a href="shop.html" class="btn btn-primary">Ir a la tienda</a>
                </div>`;
            cartActionsContainer.innerHTML = '';
            return;
        }

        let cartHTML = '';
        let total = 0;

        cart.forEach(item => {
            const product = allProducts.find(p => p.id === item.id);
            if (product) {
                const subtotal = product.price * item.quantity;
                total += subtotal;
                cartHTML += `
                    <div class="cart-item">
                        <div class="cart-item-img">
                            <img src="${product.images[0]}" alt="${product.title}">
                        </div>
                        <div class="cart-item-info">
                            <p class="cart-item-title">${product.title}</p>
                            <p class="cart-item-price">${window.formatCurrency(product.price)}</p>
                            <div class="quantity-selector">
                                <input type="number" class="cart-item-quantity" data-id="${item.id}" value="${item.quantity}" min="1" max="${product.stock}">
                            </div>
                        </div>
                        <p class="cart-item-subtotal">${window.formatCurrency(subtotal)}</p>
                        <div class="cart-item-actions">
                             <button class="remove-item-btn" data-id="${item.id}">&times;</button>
                        </div>
                    </div>
                `;
            }
        });
        cartContainer.innerHTML = cartHTML;
        renderCartActions(total);
        addEventListeners();
    };
    
    const renderCartActions = (total) => {
         cartActionsContainer.innerHTML = `
            <div id="cart-summary">
                <h3>Total: <span id="cart-total">${window.formatCurrency(total)}</span></h3>
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
        addActionsEventListeners(total);
    }

    const addEventListeners = () => {
        document.querySelectorAll('.cart-item-quantity').forEach(input => {
            input.addEventListener('change', e => {
                const id = parseInt(e.target.dataset.id);
                const quantity = parseInt(e.target.value);
                const newCart = cart.map(item => item.id === id ? { ...item, quantity } : item);
                updateCart(newCart);
            });
        });

        document.querySelectorAll('.remove-item-btn').forEach(button => {
            button.addEventListener('click', e => {
                const id = parseInt(e.target.dataset.id);
                const newCart = cart.filter(item => item.id !== id);
                updateCart(newCart);
            });
        });
    };
    
    const addActionsEventListeners = (total) => {
        const clearCartBtn = document.getElementById('clear-cart-btn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => updateCart([]));
        }

        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', e => {
                e.preventDefault();
                const name = document.getElementById('name').value;
                const address = document.getElementById('address').value;
                const delivery = document.getElementById('delivery').value;

                let message = `¡Hola! Quiero finalizar mi pedido en FullStock Shop.\n\n`;
                message += `*Cliente:* ${name}\n`;
                message += `*Zona/Barrio:* ${address}\n`;
                message += `*Entrega:* ${delivery}\n\n`;
                message += `*Resumen del pedido:*
`;

                cart.forEach(item => {
                    const product = allProducts.find(p => p.id === item.id);
                    if (product) {
                        message += `- ${product.title} (x${item.quantity})\n`;
                    }
                });

                message += `\n*Total:* ${window.formatCurrency(total)}`;
                
                sendWhatsAppMessage(message);
                updateCart([]); // Vaciar carrito después de enviar
            });
        }
    }

    // --- INICIO ---
    renderCart();
});