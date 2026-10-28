import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, parse as parseUrl } from 'node:url';
import { schema, evaluate } from './functions/_shared/engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const FILE_MAP = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/style.css': 'style.css',
  '/main.js': 'main.js',
};

function send(res, statusCode, content, contentType = 'application/json; charset=utf-8') {
  const allowedAncestors = process.env.FRAME_ANCESTORS ||
    "'self' https://*.google.com https://*.googleusercontent.com https://*.run.app";
  const csp = [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "base-uri 'none'",
    `frame-ancestors ${allowedAncestors}`,
  ].join('; ');

  const headers = {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(content),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': csp,
  };

  res.writeHead(statusCode, headers);
  res.end(content);
}

const server = http.createServer((req, res) => {
  const parsed = parseUrl(req.url);
  const pathname = parsed.pathname || '/';

  // GET & HEAD endpoints
  if (req.method === 'GET' || req.method === 'HEAD') {
    if (pathname === '/api/schema') {
      const data = JSON.stringify(schema());
      return send(res, 200, data);
    }

    const filename = FILE_MAP[pathname] || pathname.replace(/^\//, '');
    const safePath = path.normalize(path.join(STATIC_DIR, filename));

    if (safePath.startsWith(STATIC_DIR) && fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
      const ext = path.extname(safePath);
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      const content = fs.readFileSync(safePath);
      return send(res, 200, content, mime);
    }

    return send(res, 404, JSON.stringify({ error: 'No encontrado' }));
  }

  // POST endpoints
  if (req.method === 'POST') {
    if (pathname !== '/api/evaluate') {
      return send(res, 404, JSON.stringify({ error: 'No encontrado' }));
    }

    let body = '';
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 30000) {
        req.destroy();
        return;
      }
      body += chunk;
    });

    req.on('end', () => {
      if (size > 30000 || !body.trim()) {
        return send(res, 413, JSON.stringify({ error: 'Formulario demasiado grande o vacío' }));
      }

      try {
        const payload = JSON.parse(body);
        const output = evaluate(payload);
        return send(res, 200, JSON.stringify(output));
      } catch (err) {
        return send(res, 400, JSON.stringify({ error: err.message || 'Error al procesar la evaluación' }));
      }
    });

    req.on('error', (err) => {
      return send(res, 400, JSON.stringify({ error: err.message }));
    });

    return;
  }

  return send(res, 405, JSON.stringify({ error: 'Método no permitido' }));
});

// Configure host and port: CLI argument takes precedence, then environment variable, defaulting to 8080 for Cloud Run
const args = process.argv.slice(2);
let port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
let host = '0.0.0.0';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    port = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--host' && args[i + 1]) {
    host = args[i + 1];
    i++;
  }
}

server.listen(port, host, () => {
  console.log(`ViviendaSeg (Node.js) escuchando en http://${host}:${port}`);
});

process.on('SIGINT', () => {
  console.log('\nServidor detenido');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
