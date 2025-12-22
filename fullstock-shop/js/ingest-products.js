const fs = require('fs');
const path = require('path');

// --- DEPENDENCIAS DE PROCESAMIENTO (LAZY LOAD) ---
let sharp, removeBackground;
try {
    sharp = require('sharp');
    const imgly = require('@imgly/background-removal-node');
    removeBackground = imgly.removeBackground;
} catch (e) {
    console.error("\n❌ ERROR CRÍTICO: Faltan librerías de procesamiento.");
    console.error("   Por favor ejecutá: npm install sharp @imgly/background-removal-node\n");
    process.exit(1);
}

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

// --- FUNCIÓN DE CURADURÍA (IA + OPTIMIZACIÓN) ---
async function processImagePipeline(inputPath, outputPath) {
    try {
        // 1. IA: Remoción de fondo (Local)
        // Devuelve un Blob/Buffer con el fondo transparente
        const blob = await removeBackground(inputPath);
        const buffer = Buffer.from(await blob.arrayBuffer());

        // 2. SHARP: Optimización Profesional
        await sharp(buffer)
            .trim() // Quita el espacio transparente sobrante alrededor del objeto
            .resize({ width: 1000, withoutEnlargement: true }) // Estandarizar tamaño máximo
            .sharpen() // Mejora nitidez (foco)
            .modulate({ 
                brightness: 1.05, // +5% Brillo (Look e-commerce)
                saturation: 1.1   // +10% Saturación (Colores vivos)
            })
            .webp({ quality: 85, effort: 6 }) // Conversión a WebP optimizada
            .toFile(outputPath);
            
        return true;
    } catch (error) {
        console.error(`   ⚠️ Falló el procesamiento de imagen: ${path.basename(inputPath)}`, error.message);
        return false;
    }
}

// --- MAIN ASÍNCRONO ---
(async () => {
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
        
        // Regex para separar nombre y número
        const match = nameWithoutExt.match(/^(.*?)[\s\-_]*(\d+)$/);
        
        let baseName = nameWithoutExt;
        let sequence = 0;

        if (match) {
            baseName = match[1].trim();
            sequence = parseInt(match[2], 10);
        }
        
        if (!baseName) baseName = nameWithoutExt;

        const slug = createSlug(baseName);

        if (!groups[slug]) {
            groups[slug] = { title: baseName, files: [] };
        }

        groups[slug].files.push({ original: file, sequence, ext });
    });

    // --- 4. PROCESAR Y MOVER (PIPELINE) ---
    let productsData = [];
    if (fs.existsSync(jsonPath)) {
        try {
            productsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
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

    // Iteramos secuencialmente para no saturar la IA
    for (const slug of Object.keys(groups)) {
        productsDetected++;
        const group = groups[slug];
        const productDir = path.join(assetsBaseDir, slug);

        if (!fs.existsSync(productDir)) {
            fs.mkdirSync(productDir, { recursive: true });
        }

        // Ordenar por secuencia detectada
        group.files.sort((a, b) => a.sequence - b.sequence);

        // Calcular índice para no sobrescribir
        const existingFiles = fs.readdirSync(productDir).filter(f => f.endsWith('.webp'));
        let nextIndex = existingFiles.length + 1;
        
        const newImagesPaths = [];

        console.log(`⚙️  Procesando grupo: ${group.title} (${group.files.length} imágenes)...`);

        for (const fileObj of group.files) {
            // CAMBIO CLAVE: Salida siempre .webp
            const newFileName = `${nextIndex}.webp`;
            const oldPath = path.join(incomingDir, fileObj.original);
            const newPath = path.join(productDir, newFileName);
            
            // Ejecutar Pipeline de IA + Sharp
            process.stdout.write(`   > Transformando ${fileObj.original}... `);
            const success = await processImagePipeline(oldPath, newPath);

            if (success) {
                console.log("✅ OK");
                // Eliminar original solo si salió bien
                fs.unlinkSync(oldPath);
                
                newImagesPaths.push(`assets/products/${slug}/${newFileName}`);
                movedCount++;
                nextIndex++;
            } else {
                console.log("❌ OMITIDO");
            }
        }

        // Actualizar o Crear en JSON
        let product = productsData.find(p => p.id === slug);

        if (product) {
            console.log(`   🔄 Merge: Actualizando imágenes (ID: ${slug})`);
            // Agregamos las nuevas a las existentes
            product.images = [...(product.images || []), ...newImagesPaths];
            mergedProductsCount++;
        } else {
            console.log(`   ✨ Nuevo: Creando producto en catálogo`);
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
    }

    // --- 5. GUARDAR JSON ---
    fs.writeFileSync(jsonPath, JSON.stringify(productsData, null, 2), 'utf8');

    console.log("------------------------------------------------");
    console.log(`✅ Proceso finalizado.`);
    console.log(`📦 Productos procesados: ${productsDetected}`);
    console.log(`📊 Productos Totales en JSON: ${productsData.length}`);
    console.log(`✨ Nuevos agregados: ${newProductsCount}`);
    console.log(`🔄 Actualizados (Merge): ${mergedProductsCount}`);
    console.log(`🖼️  Imágenes transformadas: ${movedCount}`);
    console.log(`📄 JSON guardado en: ${jsonPath}`);
})();