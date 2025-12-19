// --- UTILITIES GLOBALES ---
window.formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Forzar reflow para animación
    void toast.offsetWidth;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
};

const updateCartCount = () => {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement && window.cartService) {
        cartCountElement.textContent = window.cartService.count();
    }
};

// --- CART SERVICE (Global) ---
const cart = {
    get: () => JSON.parse(localStorage.getItem('fullstock_cart')) || [],
    save: (data) => {
        localStorage.setItem('fullstock_cart', JSON.stringify(data));
        updateCartCount();
    },
    add: (productId, quantity = 1) => {
        const currentCart = cart.get();
        const existingItem = currentCart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            currentCart.push({ id: productId, quantity });
        }
        cart.save(currentCart);
        showToast('¡Producto agregado al carrito!');
    },
    update: (productId, quantity) => {
        let currentCart = cart.get();
        const existingItem = currentCart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity = parseInt(quantity);
            if (existingItem.quantity <= 0) {
                currentCart = currentCart.filter(item => item.id !== productId);
            }
            cart.save(currentCart);
        }
    },
    remove: (productId) => {
        let currentCart = cart.get();
        currentCart = currentCart.filter(item => item.id !== productId);
        cart.save(currentCart);
        showToast('Producto eliminado');
    },
    clear: () => {
        cart.save([]);
        showToast('Carrito vaciado');
    },
    count: () => {
        return cart.get().reduce((total, item) => total + item.quantity, 0);
    }
};

// Exponer servicio globalmente
window.cartService = cart;

document.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.getElementById('main-header');
    const footerContainer = document.getElementById('main-footer');
    const currentPage = window.location.pathname.split('/').pop();

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
    
    // --- INICIALIZACIÓN ---
    updateCartCount();
});
