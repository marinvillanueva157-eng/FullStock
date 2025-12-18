import { db } from "./firebase.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("Admin cargado");

const form = document.querySelector('form');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const price = Number(document.getElementById('price').value);
    const category = document.getElementById('category').value;
    const featured = document.getElementById('featured').checked;
    const submitBtn = document.querySelector('button');

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = "Guardando...";

        await addDoc(collection(db, "products"), {
            title,
            price,
            category,
            featured,
            createdAt: serverTimestamp()
        });

        console.log("Producto creado en Firestore");
        alert("Producto creado exitosamente");
        form.reset();
    } catch (error) {
        console.error("Error:", error);
        alert("Error: " + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Guardar producto";
    }
});