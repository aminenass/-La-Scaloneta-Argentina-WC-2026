// Simple local proxy — replaces `vercel dev` for local development.
// Reads FOOTBALL_DATA_KEY from .env.local and proxies /api/football to football-data.org
// Run with: node dev-proxy.js

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read .env.local manually
function loadEnv(file) {
  try {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // file not found — skip
  }
}

loadEnv('.env.local');
loadEnv('.env');

const KEY = process.env.FOOTBALL_DATA_KEY;
if (!KEY) {
  console.error('ERROR: FOOTBALL_DATA_KEY not found in .env.local');
  process.exit(1);
}

const PORT = 3000;

const server = http.createServer((req, res) => {
  // CORS headers for Vite dev server
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (!url.pathname.startsWith('/api/football')) {
    res.writeHead(404).end('Not found');
    return;
  }

  const apiPath = url.searchParams.get('path');
  if (!apiPath) {
    res.writeHead(400).end(JSON.stringify({ error: 'path query param required' }));
    return;
  }

  const upstreamUrl = `https://api.football-data.org/v4/${apiPath}`;
  console.log(`→ ${upstreamUrl}`);

  const options = new URL(upstreamUrl);
  const upstreamReq = https.request(
    {
      hostname: options.hostname,
      path: options.pathname + options.search,
      method: 'GET',
      headers: { 'X-Auth-Token': KEY },
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode, { 'Content-Type': 'application/json' });
      upstreamRes.pipe(res);
    }
  );

  upstreamReq.on('error', (err) => {
    res.writeHead(502).end(JSON.stringify({ error: 'Upstream fetch failed', detail: err.message }));
  });

  upstreamReq.end();
});

server.listen(PORT, () => {
  console.log(`Proxy running on http://localhost:${PORT}`);
  console.log(`FOOTBALL_DATA_KEY: ${KEY.slice(0, 6)}...`);
});
