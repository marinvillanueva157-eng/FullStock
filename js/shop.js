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
            grid.innerHTML = '<p class="col-span-full text-center">No se encontraron productos con estos filtros.</p>';
            return;
        }

        productsToRender.forEach(product => {
            const card = document.createElement('div');
            card.className = 'card';

            const hasImage = product.images && product.images.length > 0 && product.images[0];
            const imageElement = hasImage
                ? `<img src="${product.images[0]}" alt="${product.title}" class="card-image">`
                : `<div class="product-image-placeholder">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"></path></svg>
                       <p>Imagen no disponible</p>
                   </div>`;

            card.innerHTML = `
                <a href="product.html?id=${product.id}" class="card-link">
                    <div class="card-image-container">
                        ${imageElement}
                        <div class="card-badges">
                            ${product.featured ? '<span class="badge badge-featured">Destacado</span>' : ''}
                            ${product.stock > 0 ? `<span class="badge badge-stock">En Stock (${product.stock})</span>` : '<span class="badge badge-no-stock">Sin Stock</span>'}
                        </div>
                    </div>
                    <div class="card-content">
                        <p class="card-category">${product.category}</p>
                        <h3 class="card-title">${product.title}</h3>
                        <p class="card-price">${window.formatCurrency(product.price)}</p>
                    </div>
                </a>
                <div class="card-actions">
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