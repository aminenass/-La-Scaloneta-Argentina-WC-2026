import './PlayerCard.css'

const POS_ABBR = {
  Goalkeeper: 'GK',
  Defender:   'DEF',
  Midfielder: 'MID',
  Forward:    'FWD',
}

export default function PlayerCard({ name, number, club, position, photo }) {
  const lastName = name.split(' ').slice(-1)[0].toUpperCase()

  return (
    <article className="player-card">
      <div className="card-shine" aria-hidden="true" />

      <div className="card-header">
        <span className="card-number">{number ?? '—'}</span>
        <span className="card-pos-badge">{POS_ABBR[position] ?? position?.slice(0, 3).toUpperCase() ?? '—'}</span>
      </div>

      <div className="card-photo-wrap">
        <img
          className="card-photo"
          src={photo || '/assets/messi.jpg'}
          alt={name}
          onError={e => { e.currentTarget.src = '/assets/messi.jpg' }}
          loading="lazy"
        />
      </div>

      <footer className="card-footer">
        <p className="card-name">{lastName}</p>
        <p className="card-club">{club}</p>
      </footer>
    </article>
  )
}
