// fullstock-shop/admin-server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = path.resolve(__dirname);
const OVERRIDES_PATH = path.join(ROOT, 'data', 'product.overrides.json');
const GENERATED_PATH = path.join(ROOT, 'data', 'products.generated.json');
const INCOMING_PATH = path.join(ROOT, 'incoming');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

// --- LÓGICA DE AUTO-DETECCIÓN DE IMÁGENES ---
function updateGeneratedFromIncoming() {
    try {
        if (!fs.existsSync(INCOMING_PATH)) fs.mkdirSync(INCOMING_PATH, { recursive: true });
        if (!fs.existsSync(path.dirname(GENERATED_PATH))) fs.mkdirSync(path.dirname(GENERATED_PATH), { recursive: true });

        // Leer productos actuales
        let products = [];
        if (fs.existsSync(GENERATED_PATH)) {
            const content = fs.readFileSync(GENERATED_PATH, 'utf8');
            products = JSON.parse(content || '[]');
        }

        // Leer archivos en incoming
        const files = fs.readdirSync(INCOMING_PATH);
        const imageExtensions = ['.webp', '.png', '.jpg', '.jpeg'];
        
        let changed = false;

        files.forEach(file => {
            const ext = path.extname(file).toLowerCase();
            if (imageExtensions.includes(ext)) {
                const id = path.parse(file).name; // El nombre del archivo es el ID
                
                // Si el producto no existe en el JSON generado, lo creamos
                if (!products.find(p => p.id === id)) {
                    products.push({
                        id: id,
                        title: id.replace(/-/g, ' '), // Formatea "casco-rojo" a "casco rojo"
                        price: 0,
                        stock: 0,
                        category: "Sin categoría",
                        image: `incoming/${file}`
                    });
                    changed = true;
                    console.log(`✨ Nuevo producto detectado en incoming: ${file}`);
                }
            }
        });

        if (changed) {
            fs.writeFileSync(GENERATED_PATH, JSON.stringify(products, null, 2), 'utf8');
        }
    } catch (err) {
        console.error("❌ Error procesando carpeta incoming:", err);
    }
}

// --- FUNCIONES ORIGINALES ---
function send(res, status, payload, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
  if (Buffer.isBuffer(payload)) return res.end(payload);
  if (typeof payload === 'string') return res.end(payload);
  return res.end(JSON.stringify(payload, null, 2));
}

function safeReadOverrides() {
  try {
    if (!fs.existsSync(OVERRIDES_PATH)) return {};
    const raw = fs.readFileSync(OVERRIDES_PATH, 'utf8');
    const obj = JSON.parse(raw || '{}');
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
  } catch {
    return {};
  }
}

function safeWriteOverrides(obj) {
  fs.mkdirSync(path.dirname(OVERRIDES_PATH), { recursive: true });
  fs.writeFileSync(OVERRIDES_PATH, JSON.stringify(obj, null, 2), 'utf8');
}

function serveStatic(req, res) {
  const parsed = url.parse(req.url);
  let pathname = decodeURIComponent(parsed.pathname || '/');
  if (pathname === '/') pathname = '/admin.html';

  const filePath = path.join(ROOT, pathname);
  if (!filePath.startsWith(ROOT)) return send(res, 403, 'Forbidden');

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return send(res, 404, 'Not Found');
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 500, 'Server Error');
    return send(res, 200, data, mime);
  });
}

const server = http.createServer((req, res) => {
  if (req.url === '/api/overrides' && req.method === 'GET') {
    return send(res, 200, safeReadOverrides(), 'application/json; charset=utf-8');
  }

  if (req.url === '/api/overrides' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const obj = JSON.parse(body || '{}');
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
          return send(res, 400, { error: 'Invalid JSON object' }, 'application/json; charset=utf-8');
        }
        safeWriteOverrides(obj);
        return send(res, 200, { ok: true }, 'application/json; charset=utf-8');
      } catch (e) {
        return send(res, 400, { error: 'Bad JSON', details: String(e.message || e) }, 'application/json; charset=utf-8');
      }
    });
    return;
  }

  return serveStatic(req, res);
});

const PORT = 5199;
server.listen(PORT, () => {
  console.log(`✅ Admin server corriendo en http://127.0.0.1:${PORT}/admin.html`);
  // Ejecutar detección al iniciar
  updateGeneratedFromIncoming();
});