// fullstock-shop/admin-server.js (FIX: no serializar Buffers como JSON)
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = path.resolve(__dirname);
const OVERRIDES_PATH = path.join(ROOT, 'data', 'product.overrides.json');

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

// Enviar RESPUESTA de forma correcta:
// - Buffer: se manda crudo
// - string: se manda texto
// - object: se manda JSON
function send(res, status, payload, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });

  if (Buffer.isBuffer(payload)) return res.end(payload);
  if (typeof payload === 'string') return res.end(payload);
  // object / array
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

  // si no existe o es carpeta -> 404
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return send(res, 404, 'Not Found');
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 500, 'Server Error');
    // ✅ data es Buffer y se manda crudo
    return send(res, 200, data, mime);
  });
}

const server = http.createServer((req, res) => {
  // API overrides
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

  // Static
  return serveStatic(req, res);
});

const PORT = 5179;
server.listen(PORT, () => {
  console.log(`✅ Admin server corriendo en http://127.0.0.1:${PORT}/admin.html`);
});
