# FullStock

## Carga masiva local (gratis)

Este proyecto incluye una herramienta para organizar imágenes y generar datos de productos automáticamente sin necesidad de base de datos externa.

### Pasos para usar:

1.  Colocá tus imágenes (`.jpg`, `.png`, `.webp`) en la carpeta `incoming/`.
    *   *Tip:* Si tenés varias fotos del mismo producto, nombralas igual (ej: `Auriculares 1.jpg`, `Auriculares 2.jpg`).
2.  Abrí una terminal (PowerShell o CMD) en la carpeta raíz del proyecto.
3.  Ejecutá el siguiente comando:
    ```powershell
    node tools/ingest-products.js
    ```
4.  El script moverá las fotos a `assets/products/` y actualizará `data/products.generated.json`.