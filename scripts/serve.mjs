// Serveur local de prévisualisation du dossier dist/ : node scripts/serve.mjs [port]
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PORT = Number(process.argv[2] || 4173);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.json': 'application/json', '.ico': 'image/x-icon' };

http.createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(DIST, path.normalize(p));
  if (!file.startsWith(DIST)) { res.writeHead(403).end(); return; }
  try {
    const data = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }).end(data);
  } catch {
    try {
      const stat = await fs.stat(file.replace(/index\.html$/, ''));
      if (stat.isDirectory()) { res.writeHead(301, { Location: p + '/' }).end(); return; }
    } catch {}
    const page404 = await fs.readFile(path.join(DIST, '404.html')).catch(() => 'Introuvable');
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }).end(page404);
  }
}).listen(PORT, '127.0.0.1', () => console.log(`Aperçu : http://127.0.0.1:${PORT}/`));
