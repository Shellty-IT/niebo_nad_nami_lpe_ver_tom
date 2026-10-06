import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { dirname, extname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(dirname(fileURLToPath(import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.vtt': 'text/vtt; charset=utf-8' };
const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405).end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://127.0.0.1').pathname);
    if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').includes('..')) {
      response.writeHead(400).end(); return;
    }
    const target = await realpath(join(root, pathname === '/' ? 'index.html' : pathname.slice(1)));
    if (!target.startsWith(root + sep) || !(await stat(target)).isFile()) { response.writeHead(404).end(); return; }
    const mime = types[extname(target)];
    if (!mime) { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Type': mime, 'X-Content-Type-Options': 'nosniff' });
    if (request.method === 'HEAD') { response.end(); return; }
    createReadStream(target).pipe(response);
  } catch { response.writeHead(404).end(); }
});
server.listen(5173, '127.0.0.1', () => {
  console.log('Niebo nad nami: http://127.0.0.1:5173');
  console.log('Zatrzymanie: Ctrl+C');
});
