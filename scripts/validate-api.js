import { readFileSync } from 'fs';
import https from 'https';

// Read API_FOOTBALL_KEY from .env.local or .env (whichever has a real value first)
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
    const options = {
      hostname: 'v3.football.api-sports.io',
      path,
      headers: { 'x-apisports-key': key },
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Bad JSON: ' + data.slice(0, 200))); }
      });
    }).on('error', reject);
  });
}

const key = readKey();
if (!key) {
  console.error('ERROR: API_FOOTBALL_KEY not found in .env.local or .env');
  process.exit(1);
}
console.log('Key found. Running 3 validation calls (costs 3 of your 100/day quota)...\n');

// 1. Find WC 2026 league ID
const leagueRes = await apiFetch('/leagues?name=FIFA%20World%20Cup&season=2026', key);
console.log('=== WC 2026 Leagues ===');
if (!leagueRes.response?.length) {
  console.log('No results. Trying without season filter...');
  const fallback = await apiFetch('/leagues?name=FIFA%20World%20Cup', key);
  const wc = fallback.response?.filter(l => l.league.type === 'Cup' && l.league.name.includes('World Cup'));
  console.log(JSON.stringify(wc?.map(l => ({ id: l.league.id, name: l.league.name, seasons: l.seasons?.map(s => s.year) })), null, 2));
} else {
  leagueRes.response.forEach(l =>
    console.log(`  id=${l.league.id}  name="${l.league.name}"  type=${l.league.type}`)
  );
}

// 2. Find Argentina team ID
const teamRes = await apiFetch('/teams?name=Argentina&league=1&season=2026', key);
console.log('\n=== Argentina Team ===');
if (!teamRes.response?.length) {
  console.log('No result with league filter. Trying name-only...');
  const fallback = await apiFetch('/teams?search=Argentina', key);
  fallback.response?.forEach(t =>
    console.log(`  id=${t.team.id}  name="${t.team.name}"  country=${t.team.country}`)
  );
} else {
  teamRes.response.forEach(t =>
    console.log(`  id=${t.team.id}  name="${t.team.name}"  country=${t.team.country}`)
  );
}

// 3. Test comma-separated status syntax with a known fixture (use league=1 as placeholder)
//    We're not looking for results — just confirming the endpoint accepts the param without 422.
const statusTest = await apiFetch('/fixtures?league=1&season=2026&status=NS-LIVE-FT&last=1', key);
console.log('\n=== Status param test (NS-LIVE-FT) ===');
if (statusTest.errors && Object.keys(statusTest.errors).length) {
  console.log('ERRORS:', JSON.stringify(statusTest.errors));
  console.log('=> Comma-separated syntax may differ. Check api-football.com docs for correct delimiter.');
} else {
  console.log(`  HTTP response count: ${statusTest.response?.length ?? 0}`);
  console.log('  Status param accepted (no errors). Delimiter "-" is valid.');
}

console.log('\n=== Account status ===');
console.log(`  Requests used today: ${leagueRes.errors ? 'unknown' : (leagueRes.paging ? JSON.stringify(leagueRes.paging) : 'see X-RateLimit headers')}`);
