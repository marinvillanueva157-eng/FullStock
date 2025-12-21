document.addEventListener('DOMContentLoaded', () => {
  console.log('SHOP.JS ACTIVO ✅ version 2025-12-19 B (precio robusto)');

  // --- ELEMENTOS DEL DOM ---
  const grid = document.getElementById('product-grid');
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('filter-category');
  const priceRange = document.getElementById('price-range');
  const priceValue = document.getElementById('price-value');
  const sortBy = document.getElementById('sort-by');

  let allProducts = [];

  // --- HELPERS ---
  const toSafeString = (v, fallback = '') => {
    const s = String(v ?? '');
    return s.trim() ? s : fallback;
  };

  // Convierte "2.500.000", "$ 2,500,000", "2500000" -> 2500000
  // Si no puede, devuelve NaN.
  const parseMoney = (value) => {
    if (typeof value === 'number') return value;

    const raw = String(value ?? '').trim();
    if (!raw) return NaN;

    // 1) Sacar símbolos y espacios, dejar dígitos + separadores
    //    Ej: "$ 2.500.000" -> "2.500.000"
    let s = raw.replace(/[^\d.,-]/g, '');

    // 2) Si hay comas y puntos, asumimos que los separadores son miles (AR)
    //    y borramos ambos, quedándonos solo con dígitos y signo.
    //    Ej: "2.500.000" -> "2500000"
    //        "2,500,000" -> "2500000"
    //        "2.500,00"  -> "250000" (si alguien metió decimal raro, lo simplifica)
    s = s.replace(/[.,]/g, '');

    // 3) Parse final
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  };

  const formatMoney = (n) => {
    const num = Number(n) || 0;
    return window.formatCurrency ? window.formatCurrency(num) : `$ ${num.toLocaleString('es-AR')}`;
  };

  // --- RENDERIZADO DE PRODUCTOS ---
  const renderGrid = (productsToRender) => {
    console.log('renderGrid() recibió:', Array.isArray(productsToRender) ? productsToRender.length : 'NO ARRAY');
    console.log('Slugs recibidos:', Array.isArray(productsToRender) ? productsToRender.map(p => p?.slug) : productsToRender);

    grid.innerHTML = '';

    if (!Array.isArray(productsToRender) || productsToRender.length === 0) {
      grid.innerHTML = '<p class="col-span-full text-center">No se encontraron productos.</p>';
      console.log('Cards en DOM:', grid.querySelectorAll('.card').length);
      return;
    }

    productsToRender.forEach((product) => {
      try {
        const card = document.createElement('div');
        card.className = 'card reveal';

        const safeTitle = toSafeString(product?.title, 'Producto');
        const safeCategory = toSafeString(product?.category, 'General');

        const imageSrc =
          Array.isArray(product?.images) && product.images.length > 0
            ? toSafeString(product.images[0], '')
            : '';

        const imageHTML = imageSrc
          ? `<img src="${imageSrc}" alt="${safeTitle}" class="card-image">`
          : `<div class="product-image-placeholder">Sin imagen</div>`;

        const stock = Number(product?.stock) || 0;
        const price = Number(product?.price) || 0;
        const productKey = String(product?.slug ?? product?.id ?? '');

        if (!productKey) {
          console.warn('Producto sin slug/id (se omite):', product);
          return;
        }

        card.innerHTML = `
          <a href="product.html?id=${encodeURIComponent(productKey)}" class="card-link">
            <div class="card-image-container">
              ${imageHTML}
              ${stock === 0 ? '<span class="badge badge-no-stock">Sin stock</span>' : ''}
            </div>
            <div class="card-content">
              <p class="card-category">${safeCategory}</p>
              <h3 class="card-title">${safeTitle}</h3>
              <p class="card-price">${formatMoney(price)}</p>
              <p class="card-stock">Stock: ${stock}</p>
            </div>
          </a>
          <div class="card-actions">
            <button class="btn btn-primary add-to-cart-btn" data-product-id="${productKey}" ${stock === 0 ? 'disabled' : ''}>
              ${stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
            </button>
          </div>
        `;

        grid.appendChild(card);
      } catch (err) {
        console.error(
          'Error renderizando producto:',
          {
            slug: product?.slug,
            id: product?.id,
            title: product?.title,
            price: product?.price,
            images: product?.images,
            category: product?.category,
            tags: product?.tags
          },
          err
        );
      }
    });

    console.log('Cards en DOM:', grid.querySelectorAll('.card').length);

    document.querySelectorAll('.add-to-cart-btn').forEach((button) => {
      button.addEventListener('click', (e) => {
        const productId = e.currentTarget.dataset.productId;

        if (window.cartService && typeof window.cartService.add === 'function') {
          window.cartService.add(productId, 1);
        } else {
          console.warn('cartService no está disponible');
        }

        e.currentTarget.innerText = '¡Agregado!';
        setTimeout(() => {
          e.currentTarget.innerText = 'Agregar al Carrito';
        }, 1200);
      });
    });
  };

  window.renderGrid = renderGrid;

  // --- FILTRADO Y ORDEN ---
  const applyFiltersAndSort = () => {
    let filteredProducts = [...allProducts];

    const searchTerm = toSafeString(searchInput?.value, '').toLowerCase().trim();
    const selectedCategory = toSafeString(categoryFilter?.value, 'all');
    const maxPrice = Number(priceRange?.value) || 0;
    const sortOption = toSafeString(sortBy?.value, 'featured');

    if (searchTerm) {
      filteredProducts = filteredProducts.filter((p) => {
        const title = toSafeString(p?.title, '').toLowerCase();
        const tags = Array.isArray(p?.tags) ? p.tags : [];
        return (
          title.includes(searchTerm) ||
          tags.some((tag) => toSafeString(tag, '').toLowerCase().includes(searchTerm))
        );
      });
    }

    if (selectedCategory !== 'all') {
      filteredProducts = filteredProducts.filter((p) => toSafeString(p?.category, 'General') === selectedCategory);
    }

    // ✅ FILTRO DE PRECIO ROBUSTO (si el precio original venía como "$ 2.500.000", acá ya está parseado)
    filteredProducts = filteredProducts.filter((p) => {
      const price = Number(p?.price);
      // si por alguna razón quedara NaN, NO lo mates: lo dejás pasar (mejor ver el producto que ocultarlo)
      if (!Number.isFinite(price)) return true;
      return price <= maxPrice;
    });

    switch (sortOption) {
      case 'price-asc':
        filteredProducts.sort((a, b) => (Number(a?.price) || 0) - (Number(b?.price) || 0));
        break;
      case 'price-desc':
        filteredProducts.sort((a, b) => (Number(b?.price) || 0) - (Number(a?.price) || 0));
        break;
      case 'featured':
      default:
        filteredProducts.sort((a, b) => (Number(b?.featured) || 0) - (Number(a?.featured) || 0));
        break;
    }

    console.log('allProducts:', allProducts.length, allProducts.map(p => p.slug));
    console.log('filteredProducts:', filteredProducts.length, filteredProducts.map(p => p.slug));

    const joyAll = allProducts.find(p => String(p.slug).toLowerCase().includes('joy'));
    const joyFiltered = filteredProducts.find(p => String(p.slug).toLowerCase().includes('joy'));
    console.log('Joystick en allProducts:', joyAll);
    console.log('Joystick en filteredProducts:', joyFiltered);

    renderGrid(filteredProducts);
  };

  // --- INICIALIZACIÓN DE CONTROLES ---
  const initControls = () => {
    const categories = [...new Set(allProducts.map((p) => toSafeString(p?.category, 'General')))].filter(Boolean);

    const baseOptions = categoryFilter.querySelectorAll('option');
    baseOptions.forEach((opt, idx) => {
      if (idx > 0) opt.remove();
    });

    categories.forEach((cat) => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      categoryFilter.appendChild(option);
    });

    // ✅ maxPrice solo con precios FINITOS
    const prices = allProducts.map((p) => Number(p?.price)).filter((n) => Number.isFinite(n));
    const maxPrice = prices.length ? Math.max(...prices) : 0;

    priceRange.max = String(maxPrice);
    priceRange.value = String(maxPrice);
    priceValue.textContent = formatMoney(maxPrice);

    searchInput.addEventListener('input', applyFiltersAndSort);
    categoryFilter.addEventListener('change', applyFiltersAndSort);
    sortBy.addEventListener('change', applyFiltersAndSort);
    priceRange.addEventListener('input', () => {
      const v = Number(priceRange.value) || 0;
      priceValue.textContent = formatMoney(v);
      applyFiltersAndSort();
    });
  };

  // --- CARGA DE PRODUCTOS ---
  const loadProducts = () => {
    Promise.all([
      fetch('data/products.generated.json', { cache: 'no-store' }).then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      }),
      fetch('data/product.overrides.json', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : {}))
        .catch(() => ({}))
    ])
      .then(([data, overrides]) => {
        const rawData = Array.isArray(data) ? data : data?.products || [];
        const safeOverrides = overrides && typeof overrides === 'object' ? overrides : {};

        allProducts = rawData.map((p, index) => {
          const base = p && typeof p === 'object' ? p : {};
          const key = base.slug || base.id;
          const override = (key != null && safeOverrides[key]) ? safeOverrides[key] : {};
          const merged = { ...base, ...(override && typeof override === 'object' ? override : {}) };

          const slug = toSafeString(merged.slug || merged.id || merged.title || (index + 1), String(index + 1));

          // ✅ PARSEO REAL del precio desde cualquier formato
          const parsedPrice = parseMoney(merged.price);
          const price = Number.isFinite(parsedPrice) ? parsedPrice : 0;

          return {
            ...merged,
            slug,
            id: index + 1,
            title: toSafeString(merged.title, 'Producto sin nombre'),
            price,
            stock: Number(merged.stock) || 0,
            featured: Number(merged.featured) || 0,
            tags: Array.isArray(merged.tags) ? merged.tags : [],
            images: Array.isArray(merged.images) ? merged.images : [],
            description: toSafeString(merged.description, ''),
            category: toSafeString(merged.category, 'General')
          };
        });

        window.products = allProducts;

        console.log('loadProducts(): rawData:', rawData.length);
        console.log('loadProducts(): allProducts:', allProducts.length, allProducts.map(p => ({ slug: p.slug, price: p.price })));

        if (allProducts.length > 0) {
          initControls();
          applyFiltersAndSort();
        } else {
          grid.innerHTML = '<p class="col-span-full text-center">No se encontraron productos en el catálogo.</p>';
        }
      })
      .catch((error) => {
        console.error('Error cargando productos:', error);
        grid.innerHTML =
          '<p class="col-span-full text-center">Error al cargar los productos. Por favor intente más tarde.</p>';
      });
  };

  loadProducts();
});
