import { useFootballApi } from '../hooks/useFootballApi'
import './Scores.css'

const ARG_ID = 762

const STAGE_LABELS = {
  GROUP_STAGE:    'GROUP STAGE',
  LAST_16:        'ROUND OF 16',
  QUARTER_FINALS: 'QUARTERS',
  SEMI_FINALS:    'SEMI-FINALS',
  THIRD_PLACE:    'THIRD PLACE',
  FINAL:          'FINAL',
}

function getCurrentStage(matches) {
  if (!matches?.length) return null
  const live = matches.find(m => m.status === 'IN_PLAY' || m.status === 'PAUSED')
  if (live) return STAGE_LABELS[live.stage] ?? live.stage
  const finished = matches
    .filter(m => m.status === 'FINISHED')
    .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
  if (finished.length) return STAGE_LABELS[finished[0].stage] ?? finished[0].stage
  const next = matches
    .filter(m => m.status === 'SCHEDULED' || m.status === 'TIMED')
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
  if (next.length) return STAGE_LABELS[next[0].stage] ?? next[0].stage
  return null
}

function ScoreCard({ match }) {
  const live = match.status === 'IN_PLAY' || match.status === 'PAUSED'
  const isPens = match.score?.duration === 'PENALTY_SHOOTOUT'
  // For penalty matches: game score comes from regularTime → extraTime (pre-shootout draw)
  // fullTime stores the final penalty result (e.g. 4-5); score.penalties only holds the
  // tied intermediate count (e.g. 4-4 before the decisive kick) — don't use it for display
  const scoreSource = isPens
    ? (match.score?.regularTime ?? match.score?.extraTime)
    : match.score?.fullTime
  const homeScore = scoreSource?.home
  const awayScore = scoreSource?.away
  const hasScore = homeScore !== null && homeScore !== undefined
  const penHome = isPens ? match.score?.fullTime?.home : null
  const penAway = isPens ? match.score?.fullTime?.away : null
  const homeIsArg = match.homeTeam?.id === ARG_ID
  const awayIsArg = match.awayTeam?.id === ARG_ID
  const homeTla = match.homeTeam?.tla ?? match.homeTeam?.name?.slice(0, 3).toUpperCase() ?? '???'
  const awayTla = match.awayTeam?.tla ?? match.awayTeam?.name?.slice(0, 3).toUpperCase() ?? '???'

  let badge = 'FT'
  if (live) badge = 'LIVE'
  else if (isPens) badge = 'PENS'

  return (
    <div className={`score-card${live ? ' score-card--live' : ''}`}>
      <span className={`score-team score-team--home${homeIsArg ? ' score-team--arg' : ''}`}>{homeTla}</span>
      <div className="score-centre">
        <div className="score-nums">
          {hasScore ? (
            <>
              <span className="score-num">{homeScore}</span>
              <span className="score-sep">–</span>
              <span className="score-num">{awayScore}</span>
            </>
          ) : (
            <span className="score-sep">–</span>
          )}
        </div>
        <span className={`score-status-badge${live ? ' score-status-badge--live' : ''}`}>
          {badge}
        </span>
        {isPens && penHome !== null && penHome !== undefined && (
          <span className="score-pens">({penHome}–{penAway} pens)</span>
        )}
      </div>
      <span className={`score-team score-team--away${awayIsArg ? ' score-team--arg' : ''}`}>{awayTla}</span>
    </div>
  )
}

function isTodayUTC(utcDateStr) {
  const d = new Date(utcDateStr)
  const now = new Date()
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
  )
}

export default function Scores() {
  // Full schedule (all statuses) — long TTL, no polling — used only to detect match days
  const { data: scheduleData } = useFootballApi(
    'competitions/WC/matches',
    { ttl: 3600 },
  )
  const matchDayToday = (scheduleData?.matches ?? []).some(
    m => isTodayUTC(m.utcDate) &&
      (m.status === 'SCHEDULED' || m.status === 'TIMED' || m.status === 'IN_PLAY' || m.status === 'PAUSED')
  )

  const { data: liveData, loading: liveLoading } = useFootballApi(
    'competitions/WC/matches?status=IN_PLAY,PAUSED',
    { ttl: 30, pollInterval: 30, enabled: matchDayToday },
  )
  const { data: resultsData, loading: resultsLoading, error: resultsError } = useFootballApi(
    'competitions/WC/matches?status=FINISHED',
    { ttl: 300 },
  )

  const currentStage = getCurrentStage(scheduleData?.matches)

  const liveMatches = liveData?.matches ?? []
  const finishedMatches = (resultsData?.matches ?? [])
    .slice()
    .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
    .slice(0, Math.max(0, 4 - liveMatches.length))
  const loading = liveLoading || resultsLoading
  const hasContent = liveMatches.length > 0 || finishedMatches.length > 0

  return (
    <>
      <div className="scores-top-bar" />
      <div className="scores-inner">
        <div className="scores-header">
          <h2 className="scores-heading">SCORES</h2>
          <p className="scores-subheading">WC 2026 RESULTS</p>
        </div>

        {loading && (
          <div className="scores-list">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="score-skeleton" />
            ))}
          </div>
        )}

        {!loading && (
          <>
            {liveMatches.length > 0 && (
              <div className="scores-panel">
                <p className="scores-panel-label scores-panel-label--live">LIVE NOW</p>
                <div className="scores-list">
                  {liveMatches.map(m => <ScoreCard key={m.id} match={m} />)}
                </div>
              </div>
            )}

            {finishedMatches.length > 0 && (
              <div className="scores-panel">
                {liveMatches.length > 0 && (
                  <p className="scores-panel-label">RESULTS</p>
                )}
                <div className="scores-list">
                  {finishedMatches.map(m => <ScoreCard key={m.id} match={m} />)}
                </div>
              </div>
            )}

            {!hasContent && !resultsError && (
              <p className="scores-empty">No results yet — check back on match day.</p>
            )}

            {!hasContent && resultsError && (
              <p className="scores-error">Could not load scores — check back soon.</p>
            )}
          </>
        )}
      </div>
      <footer className="scores-site-footer">
        <div className="ssf-pillars">
          <div className="ssf-pillar">
            <span className="ssf-val">{currentStage ?? 'WC 2026'}</span>
            <span className="ssf-lbl">COMPETITION</span>
          </div>
          <div className="ssf-sep" />
          <div className="ssf-pillar">
            <span className="ssf-val">WC 2026</span>
            <span className="ssf-lbl">EDITION</span>
          </div>
          <div className="ssf-sep" />
          <div className="ssf-pillar">
            <span className="ssf-val">ARG</span>
            <span className="ssf-lbl">LA ALBICELESTE</span>
          </div>
        </div>
        <div className="ssf-flag-dots">
          <span className="ssf-dot ssf-dot--blue" />
          <span className="ssf-dot ssf-dot--white" />
          <span className="ssf-dot ssf-dot--blue" />
        </div>
        <p className="ssf-tagline">BUILT FOR FANS OF LA ALBICELESTE</p>
      </footer>
    </>
  )
}
