import { Link } from 'react-router-dom'
import './NotFound.css'

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found-content">
        <span className="not-found-code">404</span>
        <p className="not-found-message">Lost? Even legends take wrong turns.</p>
        <Link to="/" className="not-found-home">BACK TO HOME</Link>
      </div>
    </div>
  )
}
