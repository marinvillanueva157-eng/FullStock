document.addEventListener('DOMContentLoaded', () => {
    console.log('PRODUCT-DETAIL.JS ACTIVO ✅');

    // --- CONFIGURACIÓN ---
    const WHATSAPP_NUMBER = "5491100000000"; // ¡CAMBIAR POR TU NÚMERO REAL!

    // --- ELEMENTOS DEL DOM ---
    const els = {
        imgMain: document.getElementById('main-img'),
        thumbnails: document.getElementById('thumbnails'),
        title: document.getElementById('prod-title'),
        category: document.getElementById('prod-category'),
        price: document.getElementById('prod-price'),
        stockBadge: document.getElementById('prod-stock-badge'),
        desc: document.getElementById('prod-description'),
        btnWhatsapp: document.getElementById('btn-whatsapp'),
        btnAddCart: document.getElementById('btn-add-cart'),
        specsTable: document.getElementById('specs-table')
    };

    // --- HELPERS ---
    const formatMoney = (n) => window.formatCurrency ? window.formatCurrency(n) : `$ ${Number(n).toLocaleString('es-AR')}`;
    const getParam = (p) => new URLSearchParams(window.location.search).get(p);

    // --- CARGA DE DATOS ---
    const loadProductData = async () => {
        const productId = getParam('id');
        if (!productId) {
            window.location.href = 'shop.html'; // Redirigir si no hay ID
            return;
        }

        try {
            // 1. Cargar datos base y overrides (igual que en shop.js)
            const [baseRes, overridesRes] = await Promise.all([
                fetch('data/products.generated.json', { cache: 'no-store' }),
                fetch('data/product.overrides.json', { cache: 'no-store' }).catch(() => ({}))
            ]);

            const baseData = await baseRes.json();
            const overrides = overridesRes.ok ? await overridesRes.json() : {};
            
            const productsList = Array.isArray(baseData) ? baseData : baseData.products || [];

            // 2. Buscar producto (Lógica robusta)
            const targetId = String(productId).trim();
            
            let product = productsList.find(p => {
                const pId = String(p.id || '').trim();
                const pSlug = String(p.slug || '').trim();
                return pId === targetId || pSlug === targetId;
            });

            // Fallback: Si es un número y no se encontró por ID, buscar por índice (ajuste para shop.js)
            if (!product && !isNaN(targetId)) {
                const index = parseInt(targetId) - 1; // shop.js usa base 1
                if (productsList[index]) {
                    console.log(`Producto encontrado por índice: ${index} (ID buscado: ${targetId})`);
                    product = productsList[index];
                }
            }

            if (!product) {
                console.warn(`Producto no encontrado. Buscado: "${targetId}" en lista de ${productsList.length} items.`);
                els.title.textContent = "Producto no encontrado";
                els.desc.textContent = `No pudimos encontrar el producto con ID: ${targetId}`;
                return;
            }

            // 3. Aplicar Overrides
            const key = product.slug || product.id;
            if (overrides[key]) {
                product = { ...product, ...overrides[key] };
            }

            renderProduct(product);

        } catch (error) {
            console.error("Error cargando producto:", error);
            els.title.textContent = "Error al cargar el producto.";
        }
    };

    // --- RENDERIZADO ---
    const renderProduct = (p) => {
        // 1. Info Básica
        els.title.textContent = p.title;
        els.category.textContent = p.category || 'Tecnología';
        els.desc.textContent = p.description || 'Sin descripción disponible.';
        
        const price = Number(p.price) || 0;
        els.price.textContent = formatMoney(price);

        const stock = Number(p.stock) || 0;
        els.stockBadge.textContent = stock > 0 ? `Stock: ${stock} u.` : 'Sin Stock';
        els.stockBadge.className = `badge ${stock > 0 ? 'badge-stock' : 'badge-no-stock'}`;

        // 2. Imágenes
        const images = Array.isArray(p.images) && p.images.length ? p.images : ['assets/products/placeholder-1.png'];
        
        // Imagen Principal
        els.imgMain.src = images[0];

        // Miniaturas
        els.thumbnails.innerHTML = '';
        images.forEach((imgSrc, index) => {
            const thumb = document.createElement('img');
            thumb.src = imgSrc;
            thumb.className = index === 0 ? 'active' : '';
            thumb.onclick = () => {
                els.imgMain.src = imgSrc;
                document.querySelectorAll('.thumbnail-images img').forEach(i => i.classList.remove('active'));
                thumb.classList.add('active');
            };
            els.thumbnails.appendChild(thumb);
        });

        // 3. Botón WhatsApp Dinámico
        els.btnWhatsapp.onclick = () => {
            const message = `Hola FullStock, me interesa el producto *${p.title}* que vi en la web. ¿Me podrían asesorar?`;
            const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        };

        // 4. Botón Carrito
        if (stock > 0) {
            els.btnAddCart.onclick = () => {
                if (window.cartService) {
                    window.cartService.add(String(p.slug || p.id), 1);
                    els.btnAddCart.textContent = "¡Agregado!";
                    setTimeout(() => els.btnAddCart.textContent = "Agregar al Carrito", 1500);
                }
            };
        } else {
            els.btnAddCart.disabled = true;
            els.btnAddCart.textContent = "Sin Stock";
        }

        // 5. Tabla de Especificaciones (Generada dinámicamente)
        const specs = [
            { label: "Categoría", value: p.category },
            { label: "Modelo / ID", value: `#${p.id}` },
            { label: "Disponibilidad", value: stock > 0 ? "Inmediata" : "Consultar" },
            { label: "Etiquetas", value: (p.tags || []).join(', ') }
        ];

        els.specsTable.innerHTML = specs.map(spec => `
            <tr>
                <th>${spec.label}</th>
                <td>${spec.value || '-'}</td>
            </tr>
        `).join('');
    };

    loadProductData();
});