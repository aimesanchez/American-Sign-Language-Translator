
import { useEffect, useRef, useState } from 'react'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

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

export default function HandTracker({ videoRef, cameraActive }) {
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

    async function initialize() {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL)

        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7
        })

        if (cancelled) {
          landmarker.close()
          return
        }

        landmarkerRef.current = landmarker
        trackHands()
      } catch (err) {
        console.error(err)
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

      if (video && canvas && model && video.readyState >= 2) {
        const width = video.videoWidth
        const height = video.videoHeight

        if (width && height) {
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx.clearRect(0, 0, width, height)

          const results = model.detectForVideo(
            video,
            performance.now()
          )

          const hand = results.landmarks?.[0]
          setHandDetected(Boolean(hand))

          if (hand) {
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
  }, [cameraActive, videoRef])

  if (!cameraActive) return null

  return (
    <>
      <canvas
        ref={canvasRef}
        className="hand-overlay"
        aria-hidden="true"
      />
      <div className="hand-tracking-status" role="status">
        {error || (handDetected ? 'Hand detected' : 'Show your hand')}
      </div>
    </>
  )
}

