document.addEventListener('DOMContentLoaded', () => {
  const headerContainer = document.getElementById('main-header');
  const currentPage = window.location.pathname.split('/').pop();

  // --- CART UTILITIES (cliente) ---
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
    set: (newCart) => {
      localStorage.setItem('fullstock_cart', JSON.stringify(newCart || []));
      updateCartCount();
    },
    count: () => cart.get().reduce((total, item) => total + (Number(item.quantity) || 0), 0)
  };

  // --- TEMPLATES ---
  const headerHTML = `
    <div class="header-content">
      <a href="index.html" class="logo">FullStock</a>
      <nav class="main-nav">
        <ul>
          <li><a href="index.html" class="${currentPage === 'index.html' || currentPage === '' ? 'active' : ''}">Home</a></li>
          <li><a href="shop.html" class="${currentPage === 'shop.html' ? 'active' : ''}">Tienda</a></li>
          <li><a href="contact.html" class="${currentPage === 'contact.html' ? 'active' : ''}">Contacto</a></li>
          <li>
            <a href="cart.html" class="cart-icon-container ${currentPage === 'cart.html' ? 'active' : ''}">
              Carrito <span id="cart-count">0</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  `;

  // --- RENDER ---
  if (headerContainer) headerContainer.innerHTML = headerHTML;

  // --- GLOBALS ---
  const updateCartCount = () => {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) cartCountElement.textContent = cart.count();
  };

  window.formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(value) || 0);
  };

  updateCartCount();
  window.cartService = cart;
});
