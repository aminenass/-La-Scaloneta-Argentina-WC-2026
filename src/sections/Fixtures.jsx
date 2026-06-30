import { useFootballApi } from '../hooks/useFootballApi'
import './Fixtures.css'

const ARG_ID = 762

const STAGE_LABELS = {
  GROUP_STAGE:    'Group Stage',
  ROUND_OF_16:    'Round of 16',
  QUARTER_FINAL:  'Quarter-final',
  SEMI_FINAL:     'Semi-final',
  FINAL:          'Final',
}

function formatDate(utcDate) {
  return new Date(utcDate)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    .toUpperCase()
}

function formatKickoff(utcDate) {
  return new Date(utcDate)
    .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
}

function FixtureRow({ match }) {
  const isHome = match.homeTeam?.id === ARG_ID
  const opponent  = isHome ? match.awayTeam  : match.homeTeam
  const argScore  = isHome ? match.score?.fullTime?.home : match.score?.fullTime?.away
  const oppScore  = isHome ? match.score?.fullTime?.away : match.score?.fullTime?.home
  const finished  = match.status === 'FINISHED'
  const live      = match.status === 'IN_PLAY' || match.status === 'PAUSED'
  const hasScore  = argScore !== null && argScore !== undefined

  let result = null
  if (finished && match.score?.winner) {
    const argSide = isHome ? 'HOME_TEAM' : 'AWAY_TEAM'
    result = match.score.winner === argSide ? 'W' : match.score.winner === 'DRAW' ? 'D' : 'L'
  }

  const rowMod = live ? 'live' : result ? result.toLowerCase() : 'upcoming'
  const stageLabel = STAGE_LABELS[match.stage] ?? match.stage?.replace(/_/g, ' ')
  const oppCode = opponent?.tla ?? opponent?.name?.slice(0, 3).toUpperCase() ?? '???'

  return (
    <div className={`fixture-row fixture-row--${rowMod}`}>
      <div className="fixture-meta">
        <span className="fixture-date">{formatDate(match.utcDate)}</span>
        <span className="fixture-stage">{stageLabel}</span>
      </div>

      <div className="fixture-match">
        <span className="fixture-team fixture-team--arg">ARG</span>
        <span className="fixture-score-block">
          {(finished || live) && hasScore
            ? <><span className="fixture-num">{argScore}</span><span className="fixture-dash">–</span><span className="fixture-num">{oppScore}</span></>
            : <span className="fixture-kickoff">{formatKickoff(match.utcDate)}</span>
          }
        </span>
        <span className="fixture-team fixture-team--opp">{oppCode}</span>
      </div>

      <div className="fixture-badge-col">
        {result && <span className={`result-badge result-badge--${result.toLowerCase()}`}>{result}</span>}
        {live   && <span className="result-badge result-badge--live">LIVE</span>}
        {!result && !live && <span className="fixture-arrow">↗</span>}
      </div>
    </div>
  )
}

export default function Fixtures() {
  const { data, loading, error } = useFootballApi(
    'competitions/WC/matches?team=762',
    { ttl: 300 },
  )

  const matches = (data?.matches ?? []).filter(
    m => m.homeTeam?.id === ARG_ID || m.awayTeam?.id === ARG_ID
  )

  return (
    <>
      <div className="fixtures-top-bar" />
      <div className="fixtures-inner">
        <div className="fixtures-header">
          <h2 className="fixtures-heading">FIXTURES</h2>
          <p className="fixtures-subheading">ARGENTINA AT WC 2026</p>
        </div>

        {loading && (
          <div className="fixtures-list">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="fixture-skeleton" />
            ))}
          </div>
        )}

        {!loading && error && matches.length === 0 && (
          <p className="fixtures-error">Could not load fixtures — check back soon.</p>
        )}

        {!loading && matches.length > 0 && (
          <div className="fixtures-list">
            {matches.map(m => <FixtureRow key={m.id} match={m} />)}
          </div>
        )}
      </div>
    </>
  )
}
