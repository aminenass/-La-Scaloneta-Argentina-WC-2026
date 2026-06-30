import { useRef } from 'react'
import './NavDots.css'

export default function NavDots({ sections, activeIndex, onNavigate }) {
  const dotRefs = useRef([])

  function handleKeyDown(e, i) {
    let next = i
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = Math.min(i + 1, sections.length - 1)
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = Math.max(i - 1, 0)
    else if (e.key === 'Enter' || e.key === ' ') { onNavigate(i); return }
    else return
    e.preventDefault()
    dotRefs.current[next]?.focus()
    onNavigate(next)
  }

  return (
    <nav className="nav-dots" aria-label="Section navigation">
      {sections.map(({ label }, i) => (
        <button
          key={label}
          ref={el => (dotRefs.current[i] = el)}
          className={`nav-dot ${i === activeIndex ? 'nav-dot--active' : ''}`}
          aria-label={`Go to ${label}`}
          aria-current={i === activeIndex ? 'true' : undefined}
          tabIndex={i === activeIndex ? 0 : -1}
          onClick={() => onNavigate(i)}
          onKeyDown={e => handleKeyDown(e, i)}
        />
      ))}
    </nav>
  )
}
