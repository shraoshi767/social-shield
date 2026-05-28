import { createServer } from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config as loadEnv } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env.local');
loadEnv({ path: envPath });

console.log('Loaded env file:', envPath);
console.log('YOUTUBE_API_KEY present:', !!process.env.YOUTUBE_API_KEY);
const { default: anomalyHandler, analyzeTrending } = await import('./api/anomaly.js');
const rootDir = path.resolve(__dirname);
const port = Number(process.env.PORT || 3001);

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  if (filePath.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
}

function resolvePath(urlPath) {
  const cleanPath = new URL(urlPath, 'http://localhost').pathname;
  const localPath = cleanPath === '/' ? '/index.html' : cleanPath;
  const filePath = path.join(rootDir, localPath);
  if (!filePath.startsWith(rootDir)) return null;
  return filePath;
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    if (req.method === 'GET' && url.pathname === '/api/trending') {
      const trendingData = await analyzeTrending();
      res.status = function (code) {
        this.statusCode = code;
        return this;
      };
      res.json = function (data) {
        this.setHeader('Content-Type', 'application/json; charset=utf-8');
        this.end(JSON.stringify(data));
      };
      res.status(200).json(trendingData);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/anomaly') {
      req.body = await readRequestBody(req);
      req.headers = req.headers || {};
      req.method = 'POST';

      // Adapt plain Node response to match the API handler's Express-like interface.
      res.status = function (code) {
        this.statusCode = code;
        return this;
      };
      res.json = function (data) {
        this.setHeader('Content-Type', 'application/json; charset=utf-8');
        this.end(JSON.stringify(data));
      };

      await anomalyHandler(req, res);
      return;
    }

    if (url.pathname.startsWith('/api/')) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API route not found' }));
      return;
    }

    const filePath = resolvePath(url.pathname);
    if (!filePath) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Bad request');
      return;
    }

    const data = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType(filePath) });
    res.end(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server error: ' + error.message);
  }
});

server.listen(port, () => {
  process.stdout.write(`Server running at http://localhost:${port}\n`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the process using it or set PORT to a different port.`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});
