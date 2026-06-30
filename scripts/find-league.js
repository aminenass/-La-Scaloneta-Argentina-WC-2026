import { readFileSync } from 'fs';
import https from 'https';

function readKey() {
  for (const file of ['.env.local', '.env']) {
    try {
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        const m = line.match(/^API_FOOTBALL_KEY\s*=\s*(.+)$/);
        if (m) {
          const val = m[1].trim().replace(/^["']|["']$/g, '');
          if (val && val !== 'your_key_here') return val;
        }
      }
    } catch {}
  }
  return null;
}

function apiFetch(path, key) {
  return new Promise((resolve, reject) => {
    https.get({ hostname: 'v3.football.api-sports.io', path, headers: { 'x-apisports-key': key } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { reject(new Error(data.slice(0, 200))); } });
    }).on('error', reject);
  });
}

const key = readKey();
if (!key) { console.error('No key found'); process.exit(1); }

// WC 2022 is on free tier — find its league ID
const wc22 = await apiFetch('/leagues?season=2022&type=Cup', key);
const worldCups = wc22.response?.filter(l =>
  l.league.name.toLowerCase().includes('world cup') && l.country?.name === 'World'
);
console.log('=== World Cup leagues (2022, free tier) ===');
worldCups?.forEach(l =>
  console.log(`  id=${l.league.id}  name="${l.league.name}"  country=${l.country?.name}`)
);

// Also try direct league ID 1 (known WC ID on this API)
const league1 = await apiFetch('/leagues?id=1', key);
console.log('\n=== League ID 1 (all seasons) ===');
const l1 = league1.response?.[0];
if (l1) {
  console.log(`  id=${l1.league.id}  name="${l1.league.name}"`);
  console.log(`  Seasons: ${l1.seasons?.map(s => s.year).join(', ')}`);
} else {
  console.log('  Not found');
}
