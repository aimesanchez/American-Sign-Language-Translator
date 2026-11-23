import { Link } from 'react-router-dom'
export default function HowItWorks() {
  return <main className="page-content interior-page">
    <section className="card page-card">
      <span className="eyebrow">HOW IT WORKS</span>
      <h1>From handshape to letter.</h1>
      <ol className="steps-list">
        <li><strong>Enable your camera.</strong> Grant permission when your browser asks. Your camera preview stays on your device.</li>
        <li><strong>Show one handshape.</strong> MediaPipe detects 21 hand landmarks in the video.</li>
        <li><strong>Recognize a letter.</strong> A trained machine-learning classifier predicts one of 24 supported static handshapes.</li>
        <li><strong>Hold to confirm.</strong> Keep the same letter visible until the circular timer fills (about 1.2 seconds).</li>
        <li><strong>Build a message.</strong> Use Space, Backspace, and Clear to edit your fingerspelled text.</li>
      </ol>
      <p>J and Z are not included because their signs involve movement. Predictions can be wrong, especially while moving between letters.</p>
      <Link className="hero-button" to="/">Try recognition ↗</Link>
    </section>
  </main>
}
