
import { useState } from 'react'

const TRAINING_LETTERS = ['A', 'B', 'C', 'L', 'Y']

export default function TrainingCollector({
  selectedLetter,
  onSelectLetter,
  recording,
  samples,
  onClear
}) {
  const [message, setMessage] = useState('')

  const counts = Object.fromEntries(
    TRAINING_LETTERS.map(letter => [
      letter,
      samples.filter(sample => sample.label === letter).length
    ])
  )

  function exportSamples() {
    if (samples.length === 0) {
      setMessage('Collect some samples before exporting.')
      return
    }

    const dataset = {
      version: 2,
      featureFormat: 'wrist-relative-scale-normalized-xyz',
      featureCount: 63,
      samples
    }

    const blob = new Blob(
      [JSON.stringify(dataset, null, 2)],
      { type: 'application/json' }
    )

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `asl-training-${Date.now()}.json`
    link.click()

    URL.revokeObjectURL(url)
    setMessage('Dataset exported successfully!')
  }

  return (
    <section className="card training-card">
      <div className="section-heading">
        <div className="section-icon">✎</div>
        <div>
          <h2>ASL Training Studio</h2>
          <p>Collect labeled hand landmarks for retraining.</p>
        </div>
      </div>

      <p>
        Start your camera above, select a letter, then hold
        the correct ASL handshape while recording.
      </p>

      <div className="training-letter-grid">
        {TRAINING_LETTERS.map(letter => (
          <button
            key={letter}
            type="button"
            className={
              selectedLetter === letter
                ? 'training-letter selected'
                : 'training-letter'
            }
            disabled={recording}
            onClick={() => onSelectLetter(letter)}
          >
            {letter}
          </button>
        ))}
      </div>

      <div className="training-stats">
        <div>
          <span>Selected letter</span>
          <strong>{selectedLetter}</strong>
        </div>

        <div>
          <span>Samples for {selectedLetter}</span>
          <strong>{counts[selectedLetter]}</strong>
        </div>

        <div>
          <span>Total samples</span>
          <strong>{samples.length}</strong>
        </div>
      </div>

      <div className="training-counts">
        {TRAINING_LETTERS.map(letter => (
          <span key={letter}>
            {letter}: {counts[letter]}
          </span>
        ))}
      </div>

      <div className="training-actions">

        <button
          type="button"
          className="secondary-button"
          onClick={exportSamples}
          disabled={recording || samples.length === 0}
        >
          ↓ Export JSON
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            if (window.confirm('Clear all collected samples?')) {
              onClear()
              setMessage('')
            }
          }}
          disabled={recording || samples.length === 0}
        >
          Clear Samples
        </button>
      </div>

      {recording && (
        <p role="status">
          Recording {selectedLetter}... Hold the sign steadily.
        </p>
      )}

      {message && <p role="status">{message}</p>}

      <p className="privacy-note">
        Samples are held in browser memory until exported.
        Refreshing this page clears unexported samples.
      </p>
    </section>
  )
}
