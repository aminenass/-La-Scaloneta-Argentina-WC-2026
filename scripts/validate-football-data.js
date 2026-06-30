import { readFileSync } from 'fs';
import https from 'https';

function readKey() {
  for (const file of ['.env.local', '.env']) {
    try {
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        const m = line.match(/^FOOTBALL_DATA_KEY\s*=\s*(.+)$/);
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
    https.get(
      { hostname: 'api.football-data.org', path, headers: { 'X-Auth-Token': key } },
      (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch { reject(new Error('Bad JSON: ' + data.slice(0, 200))); }
        });
      }
    ).on('error', reject);
  });
}

const key = readKey();
if (!key) {
  console.error('ERROR: FOOTBALL_DATA_KEY not found in .env.local or .env');
  console.error('Register at https://www.football-data.org/client/register then add:');
  console.error('  FOOTBALL_DATA_KEY=your_key_here');
  process.exit(1);
}
console.log('Key found. Running validation (3 calls)...\n');

// 1. WC 2026 competition — does free tier have access?
const wc = await apiFetch('/v4/competitions/WC', key);
console.log('=== WC 2026 competition ===');
if (wc.status === 403) {
  console.log('BLOCKED (403) — free tier may not include WC. Full error:', JSON.stringify(wc.body));
} else if (wc.status === 200) {
  const c = wc.body;
  console.log(`  id=${c.id}  name="${c.name}"  code=${c.code}`);
  console.log(`  currentSeason: ${c.currentSeason?.startDate} → ${c.currentSeason?.endDate}`);
  console.log('  ACCESS: OK ✓');
} else {
  console.log(`  HTTP ${wc.status}:`, JSON.stringify(wc.body));
}

// 2. Argentina team in WC 2026
const teams = await apiFetch('/v4/competitions/WC/teams', key);
console.log('\n=== Argentina in WC 2026 ===');
if (teams.status !== 200) {
  console.log(`  HTTP ${teams.status}:`, JSON.stringify(teams.body).slice(0, 300));
} else {
  const arg = teams.body.teams?.find(t => t.name === 'Argentina' || t.shortName === 'Argentina');
  if (arg) {
    console.log(`  id=${arg.id}  name="${arg.name}"  shortName="${arg.shortName}"  tla="${arg.tla}"`);
    console.log('  FOUND ✓');
  } else {
    console.log('  Not found in team list. All teams:');
    teams.body.teams?.forEach(t => console.log(`    id=${t.id}  name="${t.name}"`));
  }
}

// 3. Live / upcoming Argentina matches
const matches = await apiFetch('/v4/competitions/WC/matches?status=LIVE,SCHEDULED,FINISHED', key);
console.log('\n=== WC 2026 matches (LIVE + SCHEDULED + FINISHED) ===');
if (matches.status !== 200) {
  console.log(`  HTTP ${matches.status}:`, JSON.stringify(matches.body).slice(0, 300));
} else {
  const all = matches.body.matches ?? [];
  const argMatches = all.filter(m =>
    m.homeTeam?.name?.includes('Argentina') || m.awayTeam?.name?.includes('Argentina')
  );
  console.log(`  Total WC matches: ${all.length}`);
  console.log(`  Argentina matches: ${argMatches.length}`);
  argMatches.forEach(m =>
    console.log(`    [${m.status}] ${m.homeTeam.name} ${m.score?.fullTime?.home ?? '?'}-${m.score?.fullTime?.away ?? '?'} ${m.awayTeam.name}  (${m.utcDate})`)
  );

  // Show distinct status values in the data
  const statuses = [...new Set(all.map(m => m.status))];
  console.log(`  Status values in use: ${statuses.join(', ')}`);
}
