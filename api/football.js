// Allowlist: only these path patterns are proxied to football-data.org.
// This prevents path traversal and SSRF — callers cannot reach arbitrary endpoints.
const ALLOWED_PATHS = [
  /^competitions\/WC\/matches(\?.*)?$/,
  /^competitions\/WC\/scorers(\?.*)?$/,
  /^competitions\/WC\/standings(\?.*)?$/,
  /^competitions\/WC\/teams(\?.*)?$/,
]

export default async function handler(req, res) {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) {
    return res.status(500).json({ error: 'API not configured' });
  }

  const { path } = req.query;
  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: 'path query param required' });
  }

  if (!ALLOWED_PATHS.some(re => re.test(path))) {
    return res.status(403).json({ error: 'Forbidden path' });
  }

  try {
    const upstream = await fetch(`https://api.football-data.org/v4/${path}`, {
      headers: { 'X-Auth-Token': key },
    });

    const data = await upstream.json();

    const cacheControl = upstream.headers.get('Cache-Control');
    if (cacheControl) res.setHeader('Cache-Control', cacheControl);

    res.status(upstream.status).json(data);
  } catch {
    res.status(502).json({ error: 'Upstream fetch failed' });
  }
}
