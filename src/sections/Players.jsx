import { useRef, useEffect, useState } from 'react'
import './Players.css'

const SQUAD = [
  // Goalkeepers
  { id: 1,  name: 'Musso',         number: 1,  position: 'Goalkeeper' },
  { id: 2,  name: 'Rulli',         number: 12, position: 'Goalkeeper' },
  { id: 3,  name: 'E. Martínez',   number: 23, position: 'Goalkeeper' },
  // Defenders
  { id: 4,  name: 'Tagliafico',    number: 3,  position: 'Defender' },
  { id: 5,  name: 'Montiel',       number: 4,  position: 'Defender' },
  { id: 6,  name: 'L. Martínez',   number: 6,  position: 'Defender' },
  { id: 7,  name: 'Romero',        number: 13, position: 'Defender' },
  { id: 8,  name: 'Otamendi',      number: 19, position: 'Defender' },
  { id: 9,  name: 'Medina',        number: 25, position: 'Defender' },
  { id: 10, name: 'Molina',        number: 26, position: 'Defender' },
  // Midfielders
  { id: 11, name: 'Senesi',        number: 2,  position: 'Midfielder' },
  { id: 12, name: 'Paredes',       number: 5,  position: 'Midfielder' },
  { id: 13, name: 'De Paul',       number: 7,  position: 'Midfielder' },
  { id: 14, name: 'Barco',         number: 8,  position: 'Midfielder' },
  { id: 15, name: 'Lo Celso',      number: 11, position: 'Midfielder' },
  { id: 16, name: 'Palacios',      number: 14, position: 'Midfielder' },
  { id: 17, name: 'N. González',   number: 15, position: 'Midfielder' },
  { id: 18, name: 'Mac Allister',  number: 20, position: 'Midfielder' },
  { id: 19, name: 'E. Fernández',  number: 24, position: 'Midfielder' },
  // Forwards
  { id: 20, name: 'Álvarez',       number: 9,  position: 'Forward' },
  { id: 21, name: 'Messi',         number: 10, position: 'Forward' },
  { id: 22, name: 'Almada',        number: 16, position: 'Forward' },
  { id: 23, name: 'G. Simeone',    number: 17, position: 'Forward' },
  { id: 24, name: 'Nico Paz',      number: 18, position: 'Forward' },
  { id: 25, name: 'J.M. López',    number: 21, position: 'Forward' },
  { id: 26, name: 'L. Martínez',   number: 22, position: 'Forward' },
]

const GROUPS = [
  { key: 'Goalkeeper', label: 'Goalkeepers' },
  { key: 'Defender',   label: 'Defenders' },
  { key: 'Midfielder', label: 'Midfielders' },
  { key: 'Forward',    label: 'Forwards' },
]

export default function Players() {
  const sectionRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current?.closest('.snap-section')
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.5 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  function handleContinue() {
    const snap = sectionRef.current?.closest('.snap-container')
    const target = document.getElementById('stats')
    if (snap && target) {
      snap.scrollTo({ top: target.offsetTop, behavior: 'smooth' })
    } else {
      target?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <div className="players-top-bar" />
      <div className="players-inner" ref={sectionRef}>
        <div className="players-header">
          <h2 className="players-heading">LA SCALONETA</h2>
          <p className="players-subheading">2026 WORLD CUP SQUAD</p>
        </div>

        <ul className="squad-list">
          {GROUPS.map(({ key, label }) => {
            const players = SQUAD.filter(p => p.position === key)
            return (
              <li key={key} className="squad-group">
                <div className="squad-pos">{label}</div>
                <div className="squad-players">
                  {players.map((p) => (
                    <span key={p.id} className="squad-player">
                      <span className="squad-name">{p.name}</span>
                      {' '}
                      <span className="squad-num">{p.number}</span>
                    </span>
                  ))}
                </div>
              </li>
            )
          })}
        </ul>

        <button
          className={`players-continue${visible ? ' players-continue--visible' : ''}`}
          onClick={handleContinue}
          aria-label="Continue to Stats"
        >
          STATS <span aria-hidden="true">→</span>
        </button>
      </div>
    </>
  )
}
