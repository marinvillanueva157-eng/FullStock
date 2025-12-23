document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.querySelector('#products-table tbody');
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const resultCount = document.getElementById('result-count');

  const downloadBtn = document.getElementById('download-overrides');
  const saveBtn = document.getElementById('save-overrides');
  const discardBtn = document.getElementById('discard-changes');
  const dirtyIndicator = document.getElementById('dirty-indicator');

  // Guardas defensivas
  if (!tableBody || !searchInput || !categoryFilter || !resultCount || !downloadBtn || !saveBtn || !discardBtn || !dirtyIndicator) {
    console.error('Admin: faltan elementos del DOM requeridos.');
    return;
  }

  let baseProducts = [];     // productos del generated (normalizados)
  let mergedProducts = [];   // productos para display (generated + overrides)
  let serverOverrides = {};  // overrides leídos del archivo real / server
  const changes = {};        // overrides persistibles (lo que se guarda/descarga)

  // Borrador (NO persistente hasta apretar Guardar)
  const draftEdits = {};     // { [slug]: { price: 15000, stock: 2, title: "...", category: "..." } }
  let dirty = false;

  // ---------- Helpers ----------
  const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
  const normalizeSlug = (p) => String(p?.slug ?? p?.id ?? '').trim();

  const toNumber = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const setStatus = (msg) => { resultCount.textContent = msg; };

  const setDirty = (on, msg = '') => {
    dirty = !!on;

    saveBtn.disabled = !dirty;
    discardBtn.disabled = !dirty;

    if (!dirty) {
      dirtyIndicator.textContent = 'Sin cambios';
      dirtyIndicator.classList.remove('dirty');
    } else {
      dirtyIndicator.textContent = msg ? `Cambios sin guardar (${msg})` : 'Cambios sin guardar';
      dirtyIndicator.classList.add('dirty');
    }
  };

  const deepClone = (obj) => JSON.parse(JSON.stringify(obj || {}));

  const clearDraft = () => {
    Object.keys(draftEdits).forEach(k => delete draftEdits[k]);
    setDirty(false);
  };

  // ---------- API detection ----------
  const hasApi = async () => {
    try {
      const res = await fetch('/api/overrides', { cache: 'no-store' });
      return res.ok;
    } catch {
      return false;
    }
  };

  // ---------- Load overrides ----------
  const loadOverrides = async () => {
    // 1) Si estoy con admin-server (API) -> lee el archivo real
    if (await hasApi()) {
      const res = await fetch('/api/overrides', { cache: 'no-store' });
      const obj = res.ok ? await res.json() : {};
      return isPlainObject(obj) ? obj : {};
    }

    // 2) Fallback estático -> intenta leer el archivo del repo
    try {
      const res = await fetch('/data/product.overrides.json', { cache: 'no-store' });
      if (!res.ok) return {};
      const obj = await res.json();
      return isPlainObject(obj) ? obj : {};
    } catch {
      return {};
    }
  };

  // ---------- Save overrides (SOLO por botón) ----------
  const persistOverrides = async (obj) => {
    const apiOk = await hasApi();
    if (!apiOk) {
      // sin API no se puede escribir archivo -> queda en modo descarga
      return { ok: false, mode: 'download' };
    }

    const res = await fetch('/api/overrides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obj)
    });

    if (!res.ok) throw new Error('No se pudo guardar overrides');
    return { ok: true, mode: 'api' };
  };

  // ---------- Build merged products ----------
  const buildMergedProducts = () => {
    mergedProducts = baseProducts.map((p) => {
      const slug = p.slug;
      const o = isPlainObject(changes[slug]) ? changes[slug] : {};
      const merged = { ...p, ...o };
      return {
        ...merged,
        slug,
        price: toNumber(merged.price, 0),
        stock: toNumber(merged.stock, 0),
        title: String(merged.title || 'Producto sin nombre'),
        category: String(merged.category || 'General'),
        images: Array.isArray(merged.images) ? merged.images : [],
        description: String(merged.description || '')
      };
    });
  };

  // ---------- Rendering ----------
  const renderTable = (products) => {
    tableBody.innerHTML = '';

    if (!Array.isArray(products) || products.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="7" style="text-align:center; padding: 20px;">No se encontraron productos.</td></tr>';
      return;
    }

    for (const product of products) {
      const row = document.createElement('tr');

      let imgContent = '<span class="no-img">Sin imagen</span>';
      if (Array.isArray(product.images) && product.images.length > 0) {
        imgContent = `<img src="${product.images[0]}" alt="${String(product.title || 'Producto')}" class="thumb">`;
      }

      const slug = product.slug || '-';

      // Nota: inputs de texto + number, pero NO guardan al tipear, solo marcan draft.
      row.innerHTML = `
        <td>${imgContent}</td>
        <td>
          <input type="text" class="edit-input" data-slug="${slug}" data-field="title"
                 value="${String(product.title || '')}" style="width: 100%;">
        </td>
        <td>${slug}</td>
        <td>
          <input type="number" step="1" class="edit-input" data-slug="${slug}" data-field="price"
                 value="${toNumber(product.price, 0)}" style="width: 120px;">
        </td>
        <td>
          <input type="number" step="1" min="0" class="edit-input" data-slug="${slug}" data-field="stock"
                 value="${toNumber(product.stock, 0)}" style="width: 90px;">
        </td>
        <td>
          <input type="text" class="edit-input" data-slug="${slug}" data-field="category"
                 value="${String(product.category || 'General')}" style="width: 100%;">
        </td>
        <td>
          <input type="text" class="edit-input" data-slug="${slug}" data-field="description"
                 value="${String(product.description || '')}" style="width: 100%; min-width: 250px;" placeholder="Breve descripción...">
        </td>
      `;
      tableBody.appendChild(row);
    }
  };

  const applyFilters = () => {
    const term = String(searchInput.value || '').toLowerCase().trim();
    const cat = String(categoryFilter.value || 'all');

    const filtered = mergedProducts.filter((p) => {
      const slug = String(p.slug || '').toLowerCase();
      const title = String(p.title || '').toLowerCase();
      const matchesSearch = !term || title.includes(term) || slug.includes(term);
      const matchesCat = cat === 'all' || String(p.category || 'General') === cat;
      return matchesSearch && matchesCat;
    });

    renderTable(filtered);
    setStatus(`${filtered.length} resultados`);
  };

  // ---------- Draft logic (NO guardar, NO re-render) ----------
  const ensureDraftSlot = (slug) => {
    if (!draftEdits[slug]) draftEdits[slug] = {};
    return draftEdits[slug];
  };

  const markDraft = (slug, field, value) => {
    const slot = ensureDraftSlot(slug);
    slot[field] = value;

    // contar “campos tocados” para mostrar algo útil
    const touchedProducts = Object.keys(draftEdits).length;
    setDirty(true, `${touchedProducts} producto(s)`);
  };

  // ---------- Apply Draft to changes ----------
  const applyDraftToChanges = () => {
    // Reglas:
    // - si el valor draft == valor base real -> no guardar override
    // - si el valor draft == valor actual en changes -> no cambia nada
    // - si queda override vacío -> se borra

    const baseBySlug = new Map(baseProducts.map(p => [p.slug, p]));

    for (const [slug, fields] of Object.entries(draftEdits)) {
      const base = baseBySlug.get(slug);
      if (!base || !isPlainObject(fields)) continue;

      for (const [field, raw] of Object.entries(fields)) {
        if (!changes[slug]) changes[slug] = {};

        if (field === 'stock') {
          const newVal = Math.max(0, Math.floor(toNumber(raw, 0)));
          const baseVal = Math.max(0, Math.floor(toNumber(base.stock, 0)));
          if (newVal === baseVal) {
            delete changes[slug][field];
          } else {
            changes[slug][field] = newVal;
          }
          continue;
        }

        if (field === 'price') {
          const newVal = Math.max(0, Math.floor(toNumber(raw, 0)));
          const baseVal = Math.max(0, Math.floor(toNumber(base.price, 0)));
          if (newVal === baseVal) {
            delete changes[slug][field];
          } else {
            changes[slug][field] = newVal;
          }
          continue;
        }

        // title / category / description
        if (field === 'title' || field === 'category' || field === 'description') {
          const newVal = String(raw ?? '').trim();
          const baseVal = String(base[field] ?? '').trim();
          if (newVal === baseVal) {
            delete changes[slug][field];
          } else {
            changes[slug][field] = newVal;
          }
        }
      }

      // si quedó vacío, borrar
      if (changes[slug] && Object.keys(changes[slug]).length === 0) {
        delete changes[slug];
      }
    }
  };

  // ---------- Events ----------
  // OJO: usamos "input" solo para marcar draft, no para guardar ni re-renderizar.
  tableBody.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.classList.contains('edit-input')) return;

    const slug = String(el.dataset.slug || '').trim();
    const field = String(el.dataset.field || '').trim();

    if (!slug) return;

    // Guardamos como draft TAL CUAL. La normalización se hace al guardar.
    if (field === 'price' || field === 'stock') {
      markDraft(slug, field, el.value);
      return;
    }

    if (field === 'title' || field === 'category' || field === 'description') {
      markDraft(slug, field, el.value);
      return;
    }
  });

  // Descargar overrides (siempre disponible)
  downloadBtn.addEventListener('click', () => {
    const jsonString = JSON.stringify(changes, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product.overrides.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  // Guardar cambios (APLICA draft + persiste + re-render)
  saveBtn.addEventListener('click', async () => {
    if (!dirty) return;

    try {
      setStatus('Aplicando cambios...');
      applyDraftToChanges();

      // Persistir si hay API
      setStatus('Guardando cambios...');
      const res = await persistOverrides(changes);

      // Rebuild display + rerender con datos ya aplicados
      buildMergedProducts();
      applyFilters();

      // Limpio draft
      clearDraft();

      const apiOk = (res && res.ok && res.mode === 'api');
      setStatus(apiOk
        ? `✅ Guardado (${mergedProducts.length} productos) - guardado manual OK`
        : `⚠️ Cambios aplicados en pantalla. Sin server: usá "Descargar Overrides".`
      );
    } catch (e) {
      console.error(e);
      setStatus(`⚠️ Error guardando (server local caído o sin permisos)`);
    }
  });

  // Descartar cambios (revierte inputs a lo que está en mergedProducts)
  discardBtn.addEventListener('click', () => {
    if (!dirty) return;

    clearDraft();

    // re-render inmediato con lo ya guardado (changes)
    buildMergedProducts();
    applyFilters();

    setStatus(`↩️ Cambios descartados`);
  });

  // ---------- INIT ----------
  (async () => {
    try {
      setStatus('Cargando...');

      // ✅ Ruta absoluta (como ya lo tenías)
      const res = await fetch('/data/products.generated.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`No se pudo cargar products.generated.json (${res.status})`);

      const data = await res.json();
      const rawData = Array.isArray(data) ? data : (data.products || []);

      // Overrides del server/archivo
      serverOverrides = await loadOverrides();

      // Normalizar baseProducts
      baseProducts = rawData.map((p, idx) => {
        const base = isPlainObject(p) ? p : {};
        const slug = normalizeSlug(base) || String(idx + 1);

        return {
          ...base,
          slug,
          title: String(base.title || 'Producto sin nombre'),
          price: toNumber(base.price, 0),
          stock: toNumber(base.stock, 0),
          category: String(base.category || 'General'),
          images: Array.isArray(base.images) ? base.images : [],
          description: String(base.description || '')
        };
      });

      // changes arranca con overrides existentes (no se pierde nada)
      Object.keys(changes).forEach((k) => delete changes[k]);
      Object.assign(changes, isPlainObject(serverOverrides) ? deepClone(serverOverrides) : {});

      // build merged
      buildMergedProducts();

      // poblar categorías (desde merged)
      // Limpiar opciones extras por si recarga
      while (categoryFilter.children.length > 1) categoryFilter.removeChild(categoryFilter.lastChild);

      const cats = [...new Set(mergedProducts.map((p) => String(p.category || 'General')))].sort();
      cats.forEach((c) => {
        const option = document.createElement('option');
        option.value = c;
        option.textContent = c;
        categoryFilter.appendChild(option);
      });

      // render inicial
      renderTable(mergedProducts);
      searchInput.addEventListener('input', applyFilters);
      categoryFilter.addEventListener('change', applyFilters);

      const apiOk = await hasApi();
      setDirty(false);

      setStatus(apiOk
        ? `✅ Admin listo (${mergedProducts.length} productos) - guardado MANUAL`
        : `⚠️ Admin listo (${mergedProducts.length} productos) - modo descarga (sin server)`
      );
    } catch (err) {
      console.error('Error cargando admin:', err);
      setStatus('Error cargando productos (revisar consola)');
      renderTable([]);
    }
  })();
});
