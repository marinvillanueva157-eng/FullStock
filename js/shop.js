document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM ---
    const grid = document.getElementById('product-grid');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('filter-category');
    const priceRange = document.getElementById('price-range');
    const priceValue = document.getElementById('price-value');
    const sortBy = document.getElementById('sort-by');

    let allProducts = window.products || [];
    
    // --- RENDERIZADO DE PRODUCTOS ---
    const renderGrid = (productsToRender) => {
        grid.innerHTML = '';
        if (productsToRender.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; font-size: 1.2rem; padding: 40px;">No se encontraron productos con estos filtros.</p>';
            return;
        }

        productsToRender.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card'; // Clase actualizada para nuevo CSS

            const imageSrc = product.images && product.images.length > 0 ? product.images[0] : null;
            // Validar que exista imagen y NO sea un placeholder local (evita 404)
            const hasImage = imageSrc && !imageSrc.includes('assets/products/placeholder');
            
            // Placeholder PRO
            const mediaHTML = hasImage
                ? `<img src="${imageSrc}" alt="${product.title}" class="product-img">`
                : `<div class="product-placeholder">
                       <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                       <span class="placeholder-text">Imagen no disponible</span>
                   </div>`;

            const stockBadge = product.stock === 0 
                ? '<span class="badge badge-nostock">Sin Stock</span>' 
                : (product.featured ? '<span class="badge badge-featured">Destacado</span>' : '');

            card.innerHTML = `
                <div class="product-media-container">
                    ${mediaHTML}
                    <div class="product-badges">
                        ${stockBadge}
                    </div>
                </div>
                
                <div class="product-content">
                    <h3 class="product-title" title="${product.title}">${product.title}</h3>
                    <p class="product-price">${window.formatCurrency(product.price)}</p>
                    
                    <button class="btn btn-primary add-to-cart-btn" data-product-id="${product.id}" ${product.stock === 0 ? 'disabled' : ''}>
                        ${product.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });

        // Añadir event listener a los botones recién creados
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.productId);
                window.cartService.add(productId, 1);
                // Opcional: mostrar una notificación
                e.target.innerText = '¡Agregado!';
                setTimeout(() => { e.target.innerText = 'Agregar al Carrito'; }, 1500);
            });
        });
    };

    // --- FILTRADO Y ORDEN ---
    const applyFiltersAndSort = () => {
        let filteredProducts = [...allProducts];
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const maxPrice = parseInt(priceRange.value);
        const sortOption = sortBy.value;

        // Filtrado por búsqueda
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(p => 
                p.title.toLowerCase().includes(searchTerm) || 
                p.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // Filtrado por categoría
        if (selectedCategory !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
        }

        // Filtrado por precio
        filteredProducts = filteredProducts.filter(p => p.price <= maxPrice);

        // Ordenamiento
        switch (sortOption) {
            case 'price-asc':
                filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'featured':
            default:
                filteredProducts.sort((a, b) => b.featured - a.featured);
                break;
        }

        renderGrid(filteredProducts);
    };

    // --- INICIALIZACIÓN DE CONTROLES ---
    const initControls = () => {
        // Poblar categorías
        const categories = [...new Set(allProducts.map(p => p.category))];
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categoryFilter.appendChild(option);
        });

        // Configurar rango de precios
        const maxPrice = Math.max(...allProducts.map(p => p.price));
        priceRange.max = maxPrice;
        priceRange.value = maxPrice;
        priceValue.textContent = window.formatCurrency(maxPrice);

        // Añadir event listeners
        searchInput.addEventListener('input', applyFiltersAndSort);
        categoryFilter.addEventListener('change', applyFiltersAndSort);
        sortBy.addEventListener('change', applyFiltersAndSort);
        priceRange.addEventListener('input', () => {
            priceValue.textContent = window.formatCurrency(priceRange.value);
            applyFiltersAndSort();
        });
    };

    // --- INICIO ---
    if (allProducts.length > 0) {
        initControls();
        applyFiltersAndSort();
    } else {
        grid.innerHTML = '<p>No se pudieron cargar los productos.</p>';
    }
});