import { db, storage } from "./firebase.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Elementos del DOM
const csvInput = document.getElementById('csvInput');
const imagesInput = document.getElementById('imagesInput');
const processBtn = document.getElementById('processBtn');
const uploadBtn = document.getElementById('uploadBtn');
const previewBody = document.getElementById('previewBody');
const logDiv = document.getElementById('logs');

// Estado
let parsedProducts = [];
let selectedImages = {};

// Función de Log
const log = (msg) => {
    console.log(msg);
    const p = document.createElement('div');
    p.textContent = `> ${msg}`;
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight;
};

// 1. Escuchar selección de imágenes
imagesInput.addEventListener('change', (e) => {
    selectedImages = {};
    if (e.target.files.length > 0) {
        Array.from(e.target.files).forEach(file => {
            selectedImages[file.name] = file;
        });
        log(`Imágenes en memoria: ${e.target.files.length}`);
    }
});

// 2. Parsear CSV
const parseCSV = (text) => {
    // Normalizar saltos de línea y filtrar vacíos
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
        // Nota: Esto asume que los valores NO tienen comas internas.
        const values = line.split(',');
        const obj = {};
        headers.forEach((h, i) => {
            obj[h] = values[i] ? values[i].trim() : '';
        });
        return obj;
    });
};

// 3. Botón Procesar (Vista Previa)
processBtn.addEventListener('click', () => {
    const file = csvInput.files[0];
    if (!file) {
        alert("Por favor seleccioná un archivo CSV.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const rawData = parseCSV(text);
        
        parsedProducts = rawData.map(item => {
            const imgName = item.imageName || '';
            const hasImage = !!selectedImages[imgName];
            
            return {
                ...item,
                uploadStatus: hasImage ? 'Listo' : 'Sin Imagen',
                file: hasImage ? selectedImages[imgName] : null
            };
        });

        log(`CSV cargado: ${parsedProducts.length} productos encontrados.`);
        renderTable();
        
        if (parsedProducts.length > 0) {
            uploadBtn.disabled = false;
        }
    };
    reader.readAsText(file);
});

// Renderizar Tabla
const renderTable = () => {
    previewBody.innerHTML = '';
    parsedProducts.forEach((p, index) => {
        const row = document.createElement('tr');
        const statusClass = p.uploadStatus === 'Listo' ? 'status-ok' : 'status-missing';
        
        row.innerHTML = `
            <td>${p.title}</td>
            <td>$${p.price}</td>
            <td>${p.category}</td>
            <td>${p.featured}</td>
            <td>${p.imageName}</td>
            <td id="status-${index}" class="${statusClass}">${p.uploadStatus}</td>
        `;
        previewBody.appendChild(row);
    });
};

// 4. Botón Subir a Firestore
uploadBtn.addEventListener('click', async () => {
    if (!confirm(`Vas a subir ${parsedProducts.length} productos. ¿Continuar?`)) return;
    
    uploadBtn.disabled = true;
    processBtn.disabled = true;
    let createdDocs = 0;
    let uploadedImages = 0;

    for (let i = 0; i < parsedProducts.length; i++) {
        const p = parsedProducts[i];
        const statusCell = document.getElementById(`status-${i}`);
        
        try {
            statusCell.textContent = 'Subiendo...';
            let imageUrl = '';

            // A) Subir Imagen a Storage
            if (p.file) {
                const storageRef = ref(storage, `products/${p.file.name}`);
                const snapshot = await uploadBytes(storageRef, p.file);
                imageUrl = await getDownloadURL(snapshot.ref);
                uploadedImages++;
                log(`Imagen subida: ${uploadedImages}/${Object.keys(selectedImages).length}`);
            }

            // B) Crear Documento en Firestore
            const productData = {
                title: p.title,
                price: Number(p.price) || 0,
                category: p.category || 'General',
                featured: p.featured?.toLowerCase() === 'true',
                stock: Number(p.stock) || 0,
                images: imageUrl ? [imageUrl] : [], // Array compatible con shop.js
                description: p.description || '',
                tags: []
            };

            await addDoc(collection(db, 'products'), productData);
            createdDocs++;
            
            statusCell.textContent = '✅ OK';
            statusCell.className = 'status-ok';

        } catch (err) {
            console.error(err);
            statusCell.textContent = '❌ Error';
            statusCell.className = 'status-error';
            log(`Error en ${p.title}: ${err.message}`);
        }
    }

    log(`Firestore: creados ${createdDocs} docs`);
    alert('Proceso finalizado.');
    uploadBtn.disabled = false;
    processBtn.disabled = false;
});