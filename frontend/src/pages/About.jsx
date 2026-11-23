import { Link } from 'react-router-dom'
export default function About() {
  return <main className="page-content interior-page">
    <section className="card page-card">
      <span className="eyebrow">ABOUT THE PROJECT</span>
      <h1>Making ASL fingerspelling recognition more accessible to explore.</h1>
      <p>This experimental project uses MediaPipe hand landmarks and a machine-learning classifier to recognize 24 static American Sign Language alphabet handshapes in a browser.</p>
      <p>The goal is to learn from people who use or study ASL, understand where recognition fails, and improve the experience through community feedback.</p>
      <h2>Current limitations</h2>
      <p>J and Z are not supported yet because they require movement. This is a fingerspelling handshape demo, not a complete ASL translator. Recognition accuracy may vary by signer, camera, lighting, and hand position.</p>
      <p>Camera video is processed locally in the browser; this demo does not upload or record camera video.</p>
      <Link className="hero-button" to="/feedback">Share feedback ↗</Link>
    </section>
  </main>
}
