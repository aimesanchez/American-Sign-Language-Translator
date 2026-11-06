
import { useEffect, useRef, useState } from 'react'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import { loadASLModel, predictASL } from '../utils/aslClassifier'

const WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm'

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
]

export default function HandTracker({
  videoRef,
  cameraActive,
  onPrediction
}) {
  const canvasRef = useRef(null)
  const landmarkerRef = useRef(null)

  const [handDetected, setHandDetected] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!cameraActive) {
      return
    }

    let cancelled = false
    let animationId
    let landmarker

    // FIX: Declare the classifier here so BOTH
    // initialize() and trackHands() can access it.
    let aslModel = null

    let lastPredictionTime = 0
    let predictionErrorLogged = false

    async function initialize() {
      try {
        setError('')
        setHandDetected(false)

        // 1. Initialize MediaPipe
        const vision = await FilesetResolver.forVisionTasks(WASM_URL)

        // 2. Create the hand detector
        landmarker = await HandLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: 'CPU'
            },
            runningMode: 'VIDEO',
            numHands: 1,
            minHandDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7
          }
        )

        if (cancelled) {
          landmarker.close()
          return
        }

        landmarkerRef.current = landmarker

        // 3. Load the converted ASL classifier
        aslModel = await loadASLModel()

        if (cancelled) {
          landmarker.close()
          return
        }

        console.log('ASL model loaded successfully!')

        // 4. Begin processing camera frames
        trackHands()

      } catch (err) {
        console.error('Hand tracking initialization error:', err)

        if (!cancelled) {
          setError('Unable to initialize hand tracking.')
        }
      }
    }

    function trackHands() {
      if (cancelled) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const model = landmarkerRef.current

      if (
        video &&
        canvas &&
        model &&
        video.readyState >= 2
      ) {
        const width = video.videoWidth
        const height = video.videoHeight

        if (width && height) {
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx.clearRect(0, 0, width, height)

          try {
            // 5. Detect hand landmarks
            const results = model.detectForVideo(
              video,
              performance.now()
            )

            const hand = results.landmarks?.[0]

            setHandDetected(Boolean(hand))

            if (hand) {
              // 6. Draw the hand skeleton
              ctx.strokeStyle = '#9de2a7'
              ctx.lineWidth = 3

              CONNECTIONS.forEach(([start, end]) => {
                const a = hand[start]
                const b = hand[end]

                ctx.beginPath()
                ctx.moveTo(a.x * width, a.y * height)
                ctx.lineTo(b.x * width, b.y * height)
                ctx.stroke()
              })

              // 7. Draw the 21 landmark dots
              ctx.fillStyle = '#ffffff'

              hand.forEach(point => {
                ctx.beginPath()
                ctx.arc(
                  point.x * width,
                  point.y * height,
                  4,
                  0,
                  Math.PI * 2
                )
                ctx.fill()
              })

              // 8. Predict an ASL letter
              // Limit predictions to about 5 per second.
              const now = performance.now()

              if (aslModel && now - lastPredictionTime >= 200) {
                lastPredictionTime = now

                try {
                  const mirrorHand = hand.map(point => ({
                    x: 1 - point.x,
                    y: point.y,
                    z: point.z
                  }))

                  const prediction = predictASL(aslModel, mirrorHand)

                  onPrediction?.(prediction)

                  console.log(
                    'Predicted letter:',
                    prediction.letter,
                    'Confidence:',
                    prediction.confidence
                  )

                } catch (predictionError) {
                  // A classifier error should not
                  // stop the hand tracker.
                  if (!predictionErrorLogged) {
                    console.error(
                      'ASL prediction error:',
                      predictionError
                    )
                    predictionErrorLogged = true
                  }
                }
              }

            } else {
              // Clear prediction when no hand is visible
              onPrediction?.(null)
            }

          } catch (trackingError) {
            console.error(
              'MediaPipe tracking error:',
              trackingError
            )

            if (!cancelled) {
              setError('Hand tracking encountered an error.')
            }
            return
          }
        }
      }

      animationId = requestAnimationFrame(trackHands)
    }

    initialize()

    return () => {
      cancelled = true
      cancelAnimationFrame(animationId)

      landmarkerRef.current = null
      landmarker?.close()
    }

  }, [cameraActive, videoRef, onPrediction])

  if (!cameraActive) return null

  return (
    <>
      <canvas
        ref={canvasRef}
        className="hand-overlay"
        aria-hidden="true"
      />

      <div
        className="hand-tracking-status"
        role="status"
      >
        {error ||
          (handDetected
            ? 'Hand detected'
            : 'Show your hand')}
      </div>
    </>
  )
}
