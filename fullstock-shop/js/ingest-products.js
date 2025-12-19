const fs = require('fs');
const path = require('path');

// --- CONFIGURACIÓN ---
const rootDir = path.resolve(__dirname, '..');
const incomingDir = path.join(rootDir, 'incoming');
const assetsBaseDir = path.join(rootDir, 'assets', 'products');
const dataDir = path.join(rootDir, 'data');
const jsonPath = path.join(dataDir, 'products.generated.json');

// --- 1. CREAR CARPETAS SI NO EXISTEN ---
[incomingDir, assetsBaseDir, dataDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Directorio creado: ${dir}`);
    }
});

// --- UTILIDADES ---
const createSlug = (text) => {
    return text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar tildes
        .replace(/\s+/g, '-')           // Espacios a guiones
        .replace(/[^\w\-]+/g, '')       // Quitar caracteres raros
        .replace(/\-\-+/g, '-')         // Reemplazar múltiples guiones
        .replace(/^-+/, '')             // Trim guiones inicio
        .replace(/-+$/, '');            // Trim guiones final
};

// --- 2. LEER INCOMING ---
console.log(`🔍 Buscando imágenes en: ${incomingDir}`);
let files = [];
try {
    files = fs.readdirSync(incomingDir);
} catch (err) {
    console.error("❌ Error leyendo incoming:", err);
    process.exit(1);
}

const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
const validFiles = files.filter(file => imageExtensions.includes(path.extname(file).toLowerCase()));

if (validFiles.length === 0) {
    console.log("ℹ️ No hay imágenes nuevas en incoming/. Solo se verificará el JSON.");
}

// --- 3. AGRUPAR POR PRODUCTO ---
const groups = {};

validFiles.forEach(file => {
    const ext = path.extname(file);
    const nameWithoutExt = path.basename(file, ext);
    
    // Regex para separar nombre y número (ej: "Samsung A12 1" -> "Samsung A12", "1")
    const match = nameWithoutExt.match(/^(.*?)[\s\-_]*(\d+)$/);
    
    let baseName = nameWithoutExt;
    let sequence = 0;

    if (match) {
        baseName = match[1].trim();
        sequence = parseInt(match[2], 10);
    }
    
    // Si el nombre quedó vacío (ej: solo era un número), usar el original
    if (!baseName) baseName = nameWithoutExt;

    const slug = createSlug(baseName);

    if (!groups[slug]) {
        groups[slug] = { title: baseName, files: [] };
    }

    groups[slug].files.push({ original: file, sequence, ext });
});

// --- 4. PROCESAR Y MOVER ---
let productsData = [];
if (fs.existsSync(jsonPath)) {
    try {
        productsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        // Asegurar que sea un array (compatibilidad)
        if (!Array.isArray(productsData) && productsData.products) {
            productsData = productsData.products;
        }
    } catch (e) {
        console.error("⚠️ Error leyendo JSON existente, se creará uno nuevo.");
        productsData = [];
    }
}

let movedCount = 0;
let productsDetected = 0;
let newProductsCount = 0;
let mergedProductsCount = 0;

Object.keys(groups).forEach(slug => {
    productsDetected++;
    const group = groups[slug];
    const productDir = path.join(assetsBaseDir, slug);

    if (!fs.existsSync(productDir)) {
        fs.mkdirSync(productDir, { recursive: true });
    }

    // Ordenar por secuencia detectada
    group.files.sort((a, b) => a.sequence - b.sequence);

    // Calcular índice para no sobrescribir (append)
    const existingFiles = fs.readdirSync(productDir).filter(f => imageExtensions.includes(path.extname(f).toLowerCase()));
    let nextIndex = existingFiles.length + 1;
    
    const newImagesPaths = [];

    group.files.forEach(fileObj => {
        const newFileName = `${nextIndex}${fileObj.ext}`;
        const oldPath = path.join(incomingDir, fileObj.original);
        const newPath = path.join(productDir, newFileName);
        
        fs.renameSync(oldPath, newPath);
        
        // Ruta relativa para el JSON (formato web)
        newImagesPaths.push(`assets/products/${slug}/${newFileName}`);
        movedCount++;
        nextIndex++;
    });

    // Actualizar o Crear en JSON
    // --- MERGE LOGIC ---
    // Buscar si ya existe por ID (slug)
    let product = productsData.find(p => p.id === slug);

    if (product) {
        // A) EXISTE: MERGE (Preservar datos, actualizar imágenes)
        console.log(`🔄 Merge: Actualizando imágenes para "${group.title}" (ID: ${slug})`);
        product.images = newImagesPaths;
        mergedProductsCount++;
    } else {
        // B) NO EXISTE: CREAR (Defaults)
        console.log(`✨ Nuevo: Creando producto "${group.title}"`);
        productsData.push({
            id: slug,
            title: group.title,
            description: "",
            category: "General",
            price: 0,
            featured: false,
            stock: 0,
            tags: [],
            images: newImagesPaths
        });
        newProductsCount++;
    }
});

// --- 5. GUARDAR JSON ---
fs.writeFileSync(jsonPath, JSON.stringify(productsData, null, 2), 'utf8');

console.log("------------------------------------------------");
console.log(`✅ Proceso finalizado.`);
console.log(`📦 Productos procesados: ${productsDetected}`);
console.log(`📊 Productos Totales en JSON: ${productsData.length}`);
console.log(`✨ Nuevos agregados: ${newProductsCount}`);
console.log(`🔄 Actualizados (Merge): ${mergedProductsCount}`);
console.log(`🖼️  Imágenes movidas: ${movedCount}`);
console.log(`📄 JSON guardado en: ${jsonPath}`);