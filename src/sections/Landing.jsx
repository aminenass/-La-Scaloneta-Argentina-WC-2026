import { useState } from 'react'
import './Landing.css'

export default function Landing({ onLoad }) {
  const [loaded, setLoaded] = useState(false)

  function handleLoad() {
    setLoaded(true)
    onLoad?.()
  }

  return (
    <div className="landing">
      <img
        className={`landing__bg${loaded ? ' landing__bg--visible' : ''}`}
        src="/assets/wc22.jpg"
        alt="La Scaloneta"
        width="1920"
        height="1080"
        fetchpriority="high"
        decoding="async"
        onLoad={handleLoad}
      />
      <div className="landing__overlay" />
      <div className={`landing__content${loaded ? ' landing__content--visible' : ''}`}>
        <h1 className="landing__title">LA SCALONETA</h1>
        <p className="landing__sub">Argentina · FIFA World Cup 2026</p>
      </div>
    </div>
  )
}
