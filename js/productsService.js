import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadProducts() {
    try {
        const productsRef = collection(db, "products");
        const snapshot = await getDocs(productsRef);

        if (!snapshot.empty) {
            const products = snapshot.docs.map(doc => {
                const data = doc.data();
                
                // Normalización de datos
                // Se mapea 'name' a 'title' y 'image' a 'images' para mantener compatibilidad 
                // con el frontend actual (shop.js) que espera title e images[].
                const name = data.name || data.title || "Producto sin nombre";
                const image = data.image || (data.images && data.images[0]) || "assets/products/placeholder-1.png";

                return {
                    id: doc.id,
                    name: name,
                    title: name, // Compatibilidad con shop.js
                    price: Number(data.price) || 0,
                    category: data.category || "General",
                    stock: typeof data.stock === 'number' ? data.stock : 0,
                    featured: typeof data.featured === 'boolean' ? data.featured : false,
                    image: image,
                    images: data.images || [image], // Compatibilidad con shop.js (array)
                    description: data.description || "",
                    tags: data.tags || []
                };
            });

            console.log(`✅ Productos cargados desde Firestore: ${products.length}`);
            return products;
        } else {
            console.log("⚠️ Fallback a products.js");
            return window.products || [];
        }
    } catch (error) {
        console.error("❌ Error Firestore, usando fallback:", error);
        return window.products || [];
    }
}