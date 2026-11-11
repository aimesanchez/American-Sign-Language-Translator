
import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import HandTracker from './components/HandTracker'
import TrainingCollector from './components/TrainingCollector'
import { normalizeLandmarks } from './utils/normalizeLandmarks'

const letters = 'ABCDEFGHIKLMNOPQRSTUVWXY'.split('')

function App() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [starting, setStarting] = useState(false)
  const [predictedLetter, setPredictedLetter] = useState('—')
  const [ selectedLetter, setSelectedLetter ] = useState('A')
  const [recording, setRecording] = useState(false)
  const [samples, setSamples] = useState([])
  const [countdown, setCountdown] = useState(null)
  const [handDetected, setHandDetected] = useState(false)

  const handDetectedRef = useRef(false)
  const countdownTimerRef = useRef(null)
  const sessionIdRef = useRef(null)
  const recordingRef = useRef(false)
  const selectedLetterRef = useRef('A')
  const lastCaptureRef = useRef(0)

  const handlePrediction = useCallback((prediction) => {
    if (prediction) {
      setPredictedLetter(prediction.letter);
    } else {
      setPredictedLetter('—');
    }
  }, []);

 
const handleLandmarks = useCallback((hand) => {
  const detected = Boolean(hand)

  if (handDetectedRef.current !== detected) {
    handDetectedRef.current = detected
    setHandDetected(detected)
  }

  // Never collect while counting down or when recording is off.
  if (!recordingRef.current || !hand) return

  const now = performance.now()

  // Maximum of five samples per second.
  if (now - lastCaptureRef.current < 200) return

  lastCaptureRef.current = now

  try {
    const features = normalizeLandmarks(hand)

    if (
      features.length !== 63 ||
      !features.every(Number.isFinite)
    ) {
      return
    }

    setSamples(previous => [
      ...previous,
      {
        label: selectedLetterRef.current,
        features,
        sessionId: sessionIdRef.current,
        timestamp: new Date().toISOString()
      }
    ])
  } catch (error) {
    console.error('Unable to capture training sample:', error)
  }
}, [])


function selectTrainingLetter(letter) {
  selectedLetterRef.current = letter
  setSelectedLetter(letter)
}


function stopRecording() {
  clearInterval(countdownTimerRef.current)
  countdownTimerRef.current = null
  recordingRef.current = false
  sessionIdRef.current = null
  setRecording(false)
  setCountdown(null)
}

function toggleRecording() {
  // Stop an active recording or cancel a countdown.
  if (recordingRef.current || countdown !== null) {
    stopRecording()
    return
  }

  if (!cameraActive) {
    alert('Start your camera before recording samples.')
    return
  }

  if (!handDetectedRef.current) {
    alert('Show your hand to the camera before recording.')
    return
  }

  let remaining = 3
  setCountdown(remaining)

  countdownTimerRef.current = setInterval(() => {
    remaining -= 1

    if (remaining > 0) {
      setCountdown(remaining)
      return
    }

    clearInterval(countdownTimerRef.current)
    countdownTimerRef.current = null
    setCountdown(null)

    // Require a visible hand when the countdown finishes.
    if (!handDetectedRef.current) {
      alert('Hand lost. Please try recording again.')
      return
    }

    sessionIdRef.current = crypto.randomUUID()
    lastCaptureRef.current = performance.now()
    recordingRef.current = true
    setRecording(true)
  }, 1000)
}


  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop())
    }
  }, [])

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {
        setCameraError('Unable to play the camera preview.')
      })
    }
  }, [cameraActive])

  useEffect(() => {
    return () => {
      clearInterval(countdownTimerRef.current)
    }
  }, [])

  async function startCamera() {
    setCameraError('')
    setStarting(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      })

      streamRef.current = stream
      setCameraActive(true)
    } catch (error) {
      console.error(error)
      setCameraError('Camera unavailable. Check browser permissions.')
    } finally {
      setStarting(false)
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    stopRecording()
    handDetectedRef.current = false
    setHandDetected(false)
    setCameraActive(false)
    setPredictedLetter('—')
  }

  function resetPrediction() {
    setPredictedLetter('—')
  }

  return (
    <div className="app" id="home">
      <header className="site-header">
        <nav className="navbar">
          <a href="#home" className="brand">
            <span className="brand-icon">✳</span>
            ASL Recognition
          </a>

          <div className="nav-links">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#feedback">Feedback</a>
          </div>
        </nav>
      </header>

      <main className="page-content">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">COMPUTER VISION × MACHINE LEARNING</span>
            <h1>American Sign Language <em>Recognition.</em></h1>
            <p>
              Explore how computer vision recognizes ASL fingerspelling
              through an interactive, real-time experience.
            </p>
            <a href="#demo" className="hero-button">
              Explore the Demo <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="hero-art" aria-hidden="true">
            <span className="hero-sparkle">✳</span>
            <span className="hero-hand">✋</span>
            <span className="hero-art-caption">LEARN · EXPLORE · IMPROVE</span>
          </div>
        </section>

        <div className="dashboard">
          <section className="card recognition-card" id="demo">
            <div className="section-heading">
              <div className="section-icon">▣</div>
              <div>
                <h2>Live ASL Recognition</h2>
                <p>Show a hand sign to the camera to explore the demo.</p>
              </div>
            </div>

            <div className="recognition-workspace">
              <div className="camera-frame">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={cameraActive ? 'camera-video' : 'camera-hidden'}
                  aria-label="Live camera preview"
                />

                <HandTracker
                  videoRef={videoRef}
                  cameraActive={cameraActive}
                  onPrediction={handlePrediction}
                  onLandmarks={handleLandmarks}
                />

                {!cameraActive && (
                  <div className="camera-placeholder">
                    <div className="camera-symbol">▣</div>
                    <p>Your camera preview will appear here</p>
                    <span>Ready when you are</span>
                  </div>
                )}

                <div className="camera-corner top-left" />
                <div className="camera-corner top-right" />
                <div className="camera-corner bottom-left" />
                <div className="camera-corner bottom-right" />

                <div className="camera-status">
                  <span className={cameraActive ? 'status-dot live' : 'status-dot'} />
                  {cameraActive ? 'Camera active' : 'Camera off'}
                </div>
              </div>

              <div className="prediction-panel">
                <div className="prediction-display">
                  <span className="prediction-label">PREDICTED LETTER</span>
                  <div className="prediction-value">{predictedLetter}</div>
                  <span className="prediction-note">
                    {cameraActive
                      ? 'Live recognition active'
                      : 'Start camera to begin'}
                  </span>
                </div>

                <button
                  className="primary-button"
                  onClick={cameraActive ? stopCamera : startCamera}
                  disabled={starting}
                >
                  {starting
                    ? 'Starting...'
                    : cameraActive
                      ? '■ Stop Camera'
                      : '▶ Start Camera'}
                </button>

                <button className="secondary-button" onClick={resetPrediction}>
                  ↻ Reset
                </button>

            {import.meta.env.DEV && (
  <div className="camera-training-controls">
    <p className="camera-training-title">
      Training Mode — Letter {selectedLetter}
    </p>

    <p className="camera-training-status" role="status">
      {recording
        ? handDetected
          ? '● Recording hand landmarks'
          : 'Hand not visible — capture paused'
        : countdown !== null
          ? `Get ready: ${countdown}`
          : handDetected
            ? 'Hand detected — ready'
            : 'Show your hand to begin'}
    </p>

    <button
      type="button"
      className={recording ? 'secondary-button' : 'primary-button'}
      onClick={toggleRecording}
      disabled={!cameraActive || (!recording && countdown === null && !handDetected)}
    >
      {recording
        ? '■ Stop Recording'
        : countdown !== null
          ? '✕ Cancel Countdown'
          : `● Record ${selectedLetter}`}
          </button>

          <span className="camera-training-count">
            {samples.filter(sample => sample.label === selectedLetter).length}
            {' '}samples collected for {selectedLetter}
          </span>
              </div>
            )}

              </div>
            </div>
            {import.meta.env.DEV && (
              <TrainingCollector
                selectedLetter={selectedLetter}
                onSelectLetter={selectTrainingLetter}
                recording={recording || countdown !== null}
                samples={samples}
                onClear={() => setSamples([])}
              />
            )}
            {cameraError && <p className="error-message" role="alert">{cameraError}</p>}

            <p className="privacy-note">
              ◈ Your camera preview stays in your browser. No video is
              recorded or uploaded by this demo.
            </p>
          </section>

          <div className="side-column">
            <section className="card alphabet-card">
              <div className="section-heading">
                <div className="section-icon">Aa</div>
                <div>
                  <h2>Supported Letters</h2>
                  <p>24 static ASL alphabet handshapes.</p>
                </div>
              </div>

              <div className="alphabet-grid">
                {letters.map(letter => (
                  <span className="letter-tile" key={letter}>{letter}</span>
                ))}
              </div>

              <div className="info-note">
                <span aria-hidden="true">ⓘ</span>
                <p>
                  J and Z are not yet supported because they involve
                  movement.
                </p>
              </div>
            </section>

            <section className="card about-card" id="about">
              <div className="section-heading">
                <div className="section-icon">✧</div>
                <div>
                  <h2>About the Project</h2>
                </div>
              </div>
              <p>
                This experimental project combines MediaPipe hand tracking
                and a machine-learning classifier to identify ASL
                fingerspelling handshapes.
              </p>
              <p>
                It's a learning and research demo, not a complete ASL
                translator.
              </p>
              <a href="#how-it-works" className="text-link">
                Learn how it works <span aria-hidden="true">→</span>
              </a>
            </section>
          </div>

          <section className="feedback-banner" id="feedback">
            <div className="feedback-icon">✎</div>
            <div className="feedback-copy">
              <h2>Help Improve This Project</h2>
              <p>
                Your feedback can help us understand recognition errors,
                improve usability, and build a better experience with the
                ASL community.
              </p>
            </div>
            <span className="feedback-coming-soon">
              Feedback form coming soon
            </span>
          </section>
        </div>

        <section className="features" id="how-it-works">
          <div className="feature">
            <span className="feature-icon">◎</span>
            <div>
              <h3>Camera-Based Recognition</h3>
              <p>Explore hand tracking through your browser's camera.</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon">◇</span>
            <div>
              <h3>Machine Learning</h3>
              <p>A classifier trained on labeled hand landmark data.</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon">♡</span>
            <div>
              <h3>Community Driven</h3>
              <p>Designed to evolve through testing and feedback.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-content">
          <strong>ASL Recognition</strong>
          <span>A Computer Vision & Machine Learning Project</span>
          <a
            href="https://github.com/aimesanchez/American-Sign-Language-Translator"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub ↗
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
