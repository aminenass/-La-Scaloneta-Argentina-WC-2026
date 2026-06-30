import { useFootballApi } from '../hooks/useFootballApi'
import './Stats.css'

function isMessi(scorer) {
  return scorer.player.name.toLowerCase().includes('messi')
}

function StatBar({ scorer, maxGoals }) {
  const messi = isMessi(scorer)
  const pct = maxGoals > 0 ? Math.round((scorer.goals / maxGoals) * 100) : 0

  return (
    <div className={`stat-row${messi ? ' stat-row--messi' : ''}`}>
      <div className="stat-player">
        <span className="stat-name">{scorer.player.name}</span>
        <span className="stat-team">{scorer.team.tla}</span>
      </div>
      <div className="stat-bar-track">
        <div className="stat-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="stat-goals">{scorer.goals}</span>
    </div>
  )
}

export default function Stats() {
  const { data, loading, error } = useFootballApi(
    'competitions/WC/scorers',
    { ttl: 3600 },
  )

  const scorers = (data?.scorers ?? []).slice(0, 8)
  const maxGoals = scorers.length > 0 ? scorers[0].goals : 0

  return (
    <>
      <div className="stats-top-bar" />
      <div className="stats-inner">
        <div className="stats-header">
          <h2 className="stats-heading">GOLDEN BOOT</h2>
          <p className="stats-subheading">WC 2026 TOP SCORERS</p>
        </div>

        {loading && (
          <div className="stats-list">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="stat-skeleton" />
            ))}
          </div>
        )}

        {!loading && error && scorers.length === 0 && (
          <p className="stats-error">Could not load scorers — check back soon.</p>
        )}

        {!loading && scorers.length > 0 && (
          <div className="stats-list">
            {scorers.map((s, i) => (
              <StatBar key={s.player.id ?? i} scorer={s} maxGoals={maxGoals} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
