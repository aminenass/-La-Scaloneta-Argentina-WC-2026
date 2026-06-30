import { useRef, useState, useEffect, useCallback } from 'react'
import NavDots from './components/NavDots'
import Landing from './sections/Landing'
import Fixtures from './sections/Fixtures'
import Players from './sections/Players'
import Stats from './sections/Stats'
import Scores from './sections/Scores'
import './App.css'

const SECTIONS = [
  { id: 'landing',  label: 'Home',     Component: Landing },
  { id: 'fixtures', label: 'Fixtures', Component: Fixtures },
  { id: 'players',  label: 'Players',  Component: Players },
  { id: 'stats',    label: 'Stats',    Component: Stats },
  { id: 'scores',   label: 'Scores',   Component: Scores },
]

export default function App() {
  const containerRef = useRef(null)
  const sectionRefs = useRef([])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observers = sectionRefs.current.map((el, i) => {
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveIndex(i) },
        { root: container, threshold: 0.5 }
      )
      obs.observe(el)
      return obs
    })

    return () => observers.forEach(obs => obs?.disconnect())
  }, [])

  const scrollTo = useCallback((index) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <div className="snap-container" ref={containerRef}>
      {SECTIONS.map(({ id, Component }, i) => (
        <section
          key={id}
          id={id}
          className="snap-section"
          ref={el => (sectionRefs.current[i] = el)}
        >
          <Component />
        </section>
      ))}
      <NavDots
        sections={SECTIONS}
        activeIndex={activeIndex}
        onNavigate={scrollTo}
      />
    </div>
  )
}
