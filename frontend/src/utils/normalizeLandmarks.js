
export function normalizeLandmarks(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length !== 21) {
    throw new Error('Expected 21 MediaPipe hand landmarks')
  }

  // Use the wrist as the origin.
  const wrist = landmarks[0]

  const relative = landmarks.map(point => ({
    x: point.x - wrist.x,
    y: point.y - wrist.y,
    z: point.z - wrist.z
  }))

  // Scale by the largest distance from the wrist.
  const scale = Math.max(
    ...relative.map(point =>
      Math.hypot(point.x, point.y, point.z)
    )
  )

  if (scale < 0.000001) {
    throw new Error('Invalid hand landmark scale')
  }

  // Produce 63 normalized features.
  return relative.flatMap(point => [
    point.x / scale,
    point.y / scale,
    point.z / scale
  ])
}
