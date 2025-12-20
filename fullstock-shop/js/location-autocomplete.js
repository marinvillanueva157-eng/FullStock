/**
 * Autocompletado de direcciones usando Photon (OpenStreetMap)
 * - Debounce
 * - Click para seleccionar
 * - Guarda label + lat/lon en hidden inputs
 */
(function () {
  function debounce(fn, wait) {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  function buildLabel(p = {}) {
    const parts = [
      p.name,
      p.street,
      p.housenumber,
      p.city,
      p.state,
      p.country
    ].filter(Boolean);

    // Evitar repetidos obvios
    const unique = [];
    for (const x of parts) if (!unique.includes(x)) unique.push(x);
    return unique.join(", ");
  }

  async function photonSearch(query) {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=es`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.features) ? data.features : [];
  }

  function clearBox(box) {
    box.innerHTML = "";
  }

  function renderSuggestions(features, box, input, hiddenChosen, hiddenLat, hiddenLon) {
    clearBox(box);
    if (!features || features.length === 0) return;

    const list = document.createElement("div");
    list.className = "suggestions-list";

    for (const f of features) {
      const label = buildLabel(f?.properties || {}) || "Ubicación";
      const coords = f?.geometry?.coordinates; // [lon, lat]
      const lon = coords && coords.length === 2 ? coords[0] : "";
      const lat = coords && coords.length === 2 ? coords[1] : "";

      const item = document.createElement("div");
      item.className = "suggestion-item";
      item.textContent = label;

      item.addEventListener("click", () => {
        input.value = label;
        if (hiddenChosen) hiddenChosen.value = label;
        if (hiddenLat) hiddenLat.value = String(lat);
        if (hiddenLon) hiddenLon.value = String(lon);
        clearBox(box);
      });

      list.appendChild(item);
    }

    box.appendChild(list);
  }

  function initLocationAutocomplete() {
    const input = document.getElementById("addressInput");
    const box = document.getElementById("addressSuggestions");
    const hiddenChosen = document.getElementById("addressChosen");
    const hiddenLat = document.getElementById("addressLat");
    const hiddenLon = document.getElementById("addressLon");

    if (!input || !box) return;

    const onInput = debounce(async () => {
      const q = (input.value || "").trim();

      // Al editar, limpiamos selección previa
      if (hiddenChosen) hiddenChosen.value = "";
      if (hiddenLat) hiddenLat.value = "";
      if (hiddenLon) hiddenLon.value = "";

      if (q.length < 3) {
        clearBox(box);
        return;
      }

      try {
        const features = await photonSearch(q);
        renderSuggestions(features, box, input, hiddenChosen, hiddenLat, hiddenLon);
      } catch (e) {
        console.warn("Autocomplete: error Photon", e);
        clearBox(box);
      }
    }, 250);

    input.addEventListener("input", onInput);

    // cerrar al click afuera
    document.addEventListener("click", (e) => {
      if (!box.contains(e.target) && e.target !== input) clearBox(box);
    });
  }

  window.initLocationAutocomplete = initLocationAutocomplete;
})();
