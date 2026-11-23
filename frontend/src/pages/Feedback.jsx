import { useState } from 'react'

const FORM_ENDPOINT = import.meta.env.VITE_FEEDBACK_FORM_URL

export default function Feedback() {
  const [status, setStatus] = useState('')
  const [sending, setSending] = useState(false)

  async function submitFeedback(event) {
    event.preventDefault()
    if (!FORM_ENDPOINT) {
      setStatus('Feedback is not connected yet. Please try again later.')
      return
    }
    setSending(true)
    setStatus('')
    const form = event.currentTarget
    const payload = Object.fromEntries(new FormData(form))
    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!response.ok) throw new Error('Submission failed')
      form.reset()
      setStatus('Thank you! Your feedback was submitted.')
    } catch {
      setStatus('Unable to send feedback. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return <main className="page-content interior-page">
    <section className="card page-card">
      <span className="eyebrow">COMMUNITY FEEDBACK</span>
      <h1>Help improve ASL Recognition.</h1>
      <p>Feedback from ASL signers, learners, and educators can help improve accuracy and usability. No name or email is required.</p>
      <form className="feedback-form" onSubmit={submitFeedback}>
        <label htmlFor="experience">Your experience with ASL (optional)</label>
        <select id="experience" name="experience" defaultValue="prefer-not">
          <option value="experienced">Experienced signer</option>
          <option value="learning">Learning ASL</option>
          <option value="new">New to ASL</option>
          <option value="prefer-not">Prefer not to say</option>
        </select>
        <label htmlFor="accuracy">How accurate was recognition?</label>
        <select id="accuracy" name="accuracy" required defaultValue="">
          <option value="" disabled>Select a rating</option>
          <option value="1">1 — Not accurate</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5 — Very accurate</option>
          <option value="not-tested">I haven't tested it</option>
        </select>
        <label htmlFor="issue">What should improve?</label>
        <select id="issue" name="issue" defaultValue="other">
          <option value="accuracy">Letter recognition</option>
          <option value="timing">Sentence builder timing</option>
          <option value="camera">Camera tracking</option>
          <option value="accessibility">Accessibility</option>
          <option value="navigation">Navigation</option>
          <option value="other">Other / general feedback</option>
        </select>
        <label htmlFor="comments">Suggestions or details</label>
        <textarea id="comments" name="comments" rows="6" maxLength="3000" placeholder="What worked? Which signs were difficult? What would you change?" required />
        <p className="feedback-privacy">Please don't include personal or sensitive information. No name or email is requested. The form provider may still process technical data such as IP addresses for security.</p>
        <button className="primary-button" type="submit" disabled={sending || !FORM_ENDPOINT}>{sending ? 'Sending…' : 'Submit feedback'}</button>
        {!FORM_ENDPOINT && <p role="status">Feedback submission will be available once the form is connected.</p>}
        {status && <p role="status">{status}</p>}
      </form>
    </section>
  </main>
}
