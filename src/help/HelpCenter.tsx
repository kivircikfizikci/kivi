import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { feedbackService, validateFeedback } from '../feedback/FeedbackService.ts'
import { KiviLogo } from '../ui/Brand/KiviLogo.tsx'
import { useSettings } from '../settings/useSettings.ts'
import { editorToolbarHelp, helpArticleForPath, helpArticles } from './helpContent.ts'

export function HelpCenter() {
  const location = useLocation()
  const { settings } = useSettings()
  const feedback = location.pathname.endsWith('/feedback')
  const article = helpArticleForPath(location.pathname)
  const toolbarHelp = editorToolbarHelp[settings.language]
  return <main className="help-center">
    <header className="help-header"><Link to="/"><KiviLogo /></Link><span>Help Center</span><Link to="/">Open Kivi</Link></header>
    <aside className="help-nav"><nav>{helpArticles.map((item) => <Link className={article.id === item.id && !feedback ? 'is-active' : ''} key={item.id} to={item.id === 'home' ? '/help' : `/help/${item.id}`}>{item.title}</Link>)}<Link className={feedback ? 'is-active' : ''} to="/help/feedback">Provide feedback</Link></nav></aside>
    <article className="help-article">{feedback ? <FeedbackForm /> : <><span className="help-eyebrow">KIVI GUIDE</span><h1>{article.title}</h1><p className="help-summary">{article.summary}</p>{article.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2><p>{section.body}</p></section>)}{article.id === 'drawing-basics' && <section><h2>{toolbarHelp.guideHeading}</h2><p>{toolbarHelp.guideBody}</p></section>}{article.id === 'release-notes' && <section><h2>{toolbarHelp.releaseHeading}</h2><p>{toolbarHelp.releaseBody}</p></section>}</>}</article>
  </main>
}

function FeedbackForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [challenge, setChallenge] = useState('')
  const [status, setStatus] = useState('')
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (Object.keys(validateFeedback({ email, message }, challenge)).length) { setStatus('Please check all fields and answer the anti-spam question.'); return }
    if (!feedbackService.available) { setStatus('Sending is not active yet. Your message has not been submitted.'); return }
    try { await feedbackService.submit({ email, message }); setStatus('Feedback sent.') } catch { setStatus('Feedback could not be sent.') }
  }
  return <><span className="help-eyebrow">KIVI FEEDBACK</span><h1>Provide feedback</h1><p className="help-summary">Tell us what would make Kivi more useful. Submission will activate when the feedback service is connected.</p><form className="feedback-form" onSubmit={(event) => void submit(event)}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Message<textarea value={message} onChange={(event) => setMessage(event.target.value)} minLength={10} required /></label><label>Anti-spam: What is 3 + 4?<input inputMode="numeric" value={challenge} onChange={(event) => setChallenge(event.target.value)} required /></label><button className="primary-button" type="submit">Send feedback</button>{status && <p role="status">{status}</p>}</form></>
}
