import './Landing.css'

export default function Landing() {
  return (
    <div className="landing">
      <img
        className="landing__bg"
        src="/assets/wc22.jpg"
        alt="La Scaloneta"
        width="1920"
        height="1080"
        fetchpriority="high"
        decoding="async"
      />
      <div className="landing__overlay" />
      <div className="landing__content">
        <h1 className="landing__title">LA SCALONETA</h1>
        <p className="landing__sub">Argentina · FIFA World Cup 2026</p>
      </div>
    </div>
  )
}
