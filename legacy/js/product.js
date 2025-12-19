document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('product-detail-container');
    const allProducts = window.products || [];

    const getProductIdFromURL = () => {
        const params = new URLSearchParams(window.location.search);
        return parseInt(params.get('id'));
    };

    const renderProduct = (product) => {
        if (!product) {
            container.innerHTML = '<p class="text-center">Producto no encontrado.</p>';
            document.title = "Producto no encontrado - FullStock Shop";
            return;
        }

        // Actualizar metadatos de la página
        document.title = `${product.title} - FullStock Shop`;
        document.querySelector('meta[name="description"]').setAttribute('content', product.description);

        const hasImages = product.images && product.images.length > 0;
        const galleryHTML = hasImages
            ? `
                <div class="main-image">
                    <img src="${product.images[0]}" alt="${product.title}" id="main-product-image">
                </div>
                <div class="thumbnail-images">
                    ${product.images.map((img, index) => `
                        <img src="${img}" alt="Thumbnail ${index + 1}" class="${index === 0 ? 'active' : ''}">
                    `).join('')}
                </div>
            `
            : `
                <div class="main-image">
                    <div class="product-image-placeholder" style="height: 400px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"></path></svg>
                        <p>Imagen no disponible</p>
                    </div>
                </div>
            `;
        
        container.innerHTML = `
            <div class="product-gallery">
                ${galleryHTML}
            </div>

            <div class="product-info">
                <p class="category">${product.category}</p>
                <h1>${product.title}</h1>
                <p class="price">${window.formatCurrency(product.price)}</p>
                <p class="stock">
                    ${product.stock > 0 ? `<span class="badge badge-stock">En Stock (${product.stock} disponibles)</span>` : '<span class="badge badge-no-stock">Sin Stock</span>'}
                </p>
                <p class="description">${product.description}</p>
                
                <div class="quantity-selector">
                    <label for="quantity">Cantidad:</label>
                    <input type="number" id="quantity" value="1" min="1" max="${product.stock}" ${product.stock === 0 ? 'disabled' : ''}>
                </div>

                <div class="product-actions">
                    <button id="add-to-cart" class="btn btn-primary" ${product.stock === 0 ? 'disabled' : ''}>
                        ${product.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
                    </button>
                    <button id="buy-whatsapp" class="btn btn-secondary">Comprar por WhatsApp</button>
                </div>
                
                <div class="tags">
                    <strong>Tags:</strong> 
                    ${product.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}
                </div>
            </div>
        `;

        if (hasImages) {
            addEventListeners(product);
        }
    };

    const addEventListeners = (product) => {
        // Galería de imágenes
        const mainImage = document.getElementById('main-product-image');
        const thumbnails = document.querySelectorAll('.thumbnail-images img');
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                mainImage.src = thumb.src;
                thumbnails.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
        });

        const quantityInput = document.getElementById('quantity');

        // Botón de agregar al carrito
        const addToCartBtn = document.getElementById('add-to-cart');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                const quantity = parseInt(quantityInput.value);
                if (quantity > 0) {
                    window.cartService.add(product.id, quantity);
                    addToCartBtn.innerText = '¡Agregado!';
                    setTimeout(() => { addToCartBtn.innerText = 'Agregar al Carrito'; }, 1500);
                }
            });
        }
        
        // Botón de comprar por WhatsApp
        const buyWhatsAppBtn = document.getElementById('buy-whatsapp');
        if(buyWhatsAppBtn) {
            buyWhatsAppBtn.addEventListener('click', () => {
                const quantity = parseInt(quantityInput.value);
                const message = `¡Hola! Estoy interesado en comprar ${quantity} unidad(es) de "${product.title}". ¿Podrían confirmarme el stock y los pasos a seguir?`;
                sendWhatsAppMessage(message);
            });
        }
    };

    // --- INICIO ---
    const productId = getProductIdFromURL();
    const product = allProducts.find(p => p.id === productId);
    renderProduct(product);
});