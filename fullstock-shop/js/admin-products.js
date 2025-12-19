document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#products-table tbody');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const resultCount = document.getElementById('result-count');

    let allProducts = [];

    // Formateador simple de moneda
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
    };

    const renderTable = (products) => {
        tableBody.innerHTML = '';
        
        if (products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No se encontraron productos.</td></tr>';
            resultCount.textContent = '0 resultados';
            return;
        }

        products.forEach(product => {
            const row = document.createElement('tr');
            
            // Imagen
            let imgContent = '<span class="no-img">Sin imagen</span>';
            if (product.images && product.images.length > 0) {
                imgContent = `<img src="${product.images[0]}" alt="${product.title}" class="thumb">`;
            }

            // Slug: usamos id o propiedad slug si existe
            const slug = product.slug || product.id || '-';

            row.innerHTML = `
                <td>${imgContent}</td>
                <td>${product.title}</td>
                <td>${slug}</td>
                <td>${formatCurrency(product.price)}</td>
                <td>${product.stock}</td>
                <td>${product.category}</td>
            `;
            tableBody.appendChild(row);
        });

        resultCount.textContent = `${products.length} resultados`;
    };

    const applyFilters = () => {
        const term = searchInput.value.toLowerCase();
        const cat = categoryFilter.value;

        const filtered = allProducts.filter(p => {
            const slug = String(p.slug || p.id || '').toLowerCase();
            const title = String(p.title || '').toLowerCase();
            const matchesSearch = title.includes(term) || slug.includes(term);
            const matchesCat = cat === 'all' || p.category === cat;
            return matchesSearch && matchesCat;
        });

        renderTable(filtered);
    };

    fetch('data/products.generated.json', { cache: "no-store" })
        .then(res => res.json())
        .then(data => {
            const rawData = Array.isArray(data) ? data : (data.products || []);
            
            allProducts = rawData.map(p => ({
                ...p,
                price: Number(p.price) || 0,
                stock: Number(p.stock) || 0,
                category: String(p.category || 'General'),
                images: Array.isArray(p.images) ? p.images : []
            }));

            // Poblar filtro de categorías
            const categories = [...new Set(allProducts.map(p => p.category))].sort();
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                categoryFilter.appendChild(option);
            });

            renderTable(allProducts);

            searchInput.addEventListener('input', applyFilters);
            categoryFilter.addEventListener('change', applyFilters);
        })
        .catch(err => {
            console.error('Error cargando productos:', err);
            resultCount.textContent = 'Error de conexión';
        });
});