document.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.getElementById('main-header');
    const footerContainer = document.getElementById('main-footer');
    const currentPage = window.location.pathname.split('/').pop();

    // --- CART UTILITIES (Lado del cliente) ---
    const cart = {
        get: () => JSON.parse(localStorage.getItem('fullstock_cart')) || [],
        add: (productId, quantity) => {
            const currentCart = cart.get();
            const existingItem = currentCart.find(item => item.id === productId);
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                currentCart.push({ id: productId, quantity });
            }
            localStorage.setItem('fullstock_cart', JSON.stringify(currentCart));
            updateCartCount();
        },
        count: () => {
            return cart.get().reduce((total, item) => total + item.quantity, 0);
        }
    };

    // --- TEMPLATES ---
    const headerHTML = `
        <div class="header-content">
            <a href="index.html" class="logo">
                <!-- Cuando tengas tu logo, reemplaza el texto por: <img src="assets/brand/logo.png" alt="FullStock Logo"> -->
                FullStock
            </a>
            <nav class="main-nav">
                <ul>
                    <li><a href="index.html" class="${currentPage === 'index.html' || currentPage === '' ? 'active' : ''}">Home</a></li>
                    <li><a href="shop.html" class="${currentPage === 'shop.html' ? 'active' : ''}">Tienda</a></li>
                    <li><a href="contact.html" class="${currentPage === 'contact.html' ? 'active' : ''}">Contacto</a></li>
                    <li>
                        <a href="cart.html" class="cart-icon-container ${currentPage === 'cart.html' ? 'active' : ''}">
                            Carrito
                            <span id="cart-count">0</span>
                        </a>
                    </li>
                </ul>
            </nav>
        </div>
    `;

    const footerHTML = `
        <div class="footer-content">
            <div class="footer-grid">
                <div class="footer-column">
                    <h3>Institucional</h3>
                    <ul>
                        <li><a href="policies.html">Políticas de la Tienda</a></li>
                        <li><a href="#">Sobre Nosotros</a></li>
                        <li><a href="#">Términos y Condiciones</a></li>
                    </ul>
                </div>
                <div class="footer-column">
                    <h3>Ayuda</h3>
                    <ul>
                        <li><a href="#">Preguntas Frecuentes</a></li>
                        <li><a href="#">Cómo comprar</a></li>
                        <li><a href="#">Envíos y Devoluciones</a></li>
                    </ul>
                </div>
                <div class="footer-column">
                    <h3>Contacto</h3>
                    <p>
                        Lunes a Viernes de 9 a 18hs<br>
                        <a href="mailto:contacto@fullstock.example.com">contacto@fullstock.example.com</a>
                    </p>
                    <!-- Aca puedes agregar iconos de redes sociales -->
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; ${new Date().getFullYear()} FullStock Shop. Todos los derechos reservados.</p>
            </div>
        </div>
    `;

    // --- RENDER ---
    if (headerContainer) headerContainer.innerHTML = headerHTML;
    if (footerContainer) footerContainer.innerHTML = footerHTML;
    
    // --- FUNCIONES GLOBALES ---
    const updateCartCount = () => {
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = cart.count();
        }
    };
    
    // Formatear precios a ARS
    window.formatCurrency = (value) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // --- INICIALIZACIÓN ---
    updateCartCount();

    // Adjuntar la utilidad del carrito a window para que otros scripts la puedan usar
    window.cartService = cart;
});
