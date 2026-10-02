import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { commandRegistry } from '../commands/commandRegistry.ts'
import { feedbackService, validateFeedback } from '../feedback/FeedbackService.ts'
import { useI18n } from '../i18n/I18nContext.ts'
import type { Locale } from '../i18n/types.ts'
import { useSettings } from '../settings/useSettings.ts'
import { KiviLogo } from '../ui/Brand/KiviLogo.tsx'
import {
  developerSupportEmail,
  helpArticleForPath,
  helpArticlesForLocale,
  helpCategories,
  helpHomeGroups,
  helpLocaleForSetting,
  helpMetadata,
  helpPath,
  helpUi,
  type LocalizedHelpArticle,
} from './helpContent.ts'

export function HelpCenter() {
  const location = useLocation()
  const { t } = useI18n()
  const { settings, updateSettings } = useSettings()
  const locale = helpLocaleForSetting(settings.language)
  const ui = helpUi[locale]
  const articles = helpArticlesForLocale(locale)
  const article = helpArticleForPath(location.pathname, locale)
  const categories = [...new Set(articles.map((item) => item.category))]

  return <main className="help-center">
    <header className="help-header">
      <Link to="/"><KiviLogo /></Link>
      <span>{ui.center}</span>
      <div className="help-language" role="group" aria-label={ui.language}>
        {(['en', 'tr'] as Locale[]).map((language) => <button key={language} type="button" className={locale === language ? 'is-active' : ''} onClick={() => updateSettings({ language })}>{language === 'en' ? ui.english : ui.turkish}</button>)}
      </div>
      <Link className="help-open-kivi" to="/">{ui.openKivi}</Link>
    </header>
    <aside className="help-nav">
      <nav>{categories.map((category) => <section key={category}><h2>{helpCategories[locale][category]}</h2>{articles.filter((item) => item.category === category).map((item) => <Link className={article.id === item.id ? 'is-active' : ''} key={item.id} to={helpPath(item)}>{item.title}</Link>)}</section>)}</nav>
    </aside>
    <article className="help-article">
      <span className="help-eyebrow">{ui.guide}</span>
      <h1>{article.title}</h1>
      <p className="help-summary">{article.summary}</p>
      {article.kind === 'home' && <HelpHome locale={locale} articles={articles} />}
      {article.kind === 'feedback' && <FeedbackForm locale={locale} />}
      {article.kind !== 'home' && article.kind !== 'feedback' && <ArticleSections article={article} />}
      {article.kind === 'commands' && <div className="help-command-table" role="table" aria-label={article.title}><div className="help-command-row is-heading" role="row"><strong>{ui.commands}</strong><strong>{ui.aliases}</strong></div>{commandRegistry.map((command) => <div className="help-command-row" role="row" key={command.id}><span><code>{command.id}</code> · {t(command.labelKey)}</span><code>{command.aliases.join(', ') || ui.noAlias}</code></div>)}</div>}
      {article.kind === 'support' && <a className="support-email" href={`mailto:${developerSupportEmail}`}>{developerSupportEmail}</a>}
      <footer className="help-document-meta">KIVI {helpMetadata.appVersion} · {helpMetadata.lastUpdated}</footer>
    </article>
  </main>
}

function HelpHome({ locale, articles }: { locale: Locale; articles: LocalizedHelpArticle[] }) {
  const byId = new Map(articles.map((item) => [item.id, item]))
  return <div className="help-home-groups">{helpHomeGroups[locale].map((group) => <section key={group.title}><h2>{group.title}</h2><div className="help-home-links">{group.ids.map((id) => { const item = byId.get(id)!; return <Link key={id} to={helpPath(item)}><strong>{item.title}</strong><span>{item.summary}</span></Link> })}</div></section>)}</div>
}

function ArticleSections({ article }: { article: LocalizedHelpArticle }) {
  const sections = article.sections.map((section) => <section className={article.kind === 'release-notes' ? 'help-release-note' : undefined} key={section.heading}><h2>{section.heading}</h2>{section.date && <time className="help-release-date">{section.date}</time>}{section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.steps && <ol>{section.steps.map((step) => <li key={step}>{step}</li>)}</ol>}{section.bullets && <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}</section>)
  return article.kind === 'release-notes' ? <div className="help-release-list">{sections}</div> : <>{sections}</>
}

function FeedbackForm({ locale }: { locale: Locale }) {
  const ui = helpUi[locale]
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [challenge, setChallenge] = useState('')
  const [status, setStatus] = useState('')
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (Object.keys(validateFeedback({ email, message }, challenge)).length) { setStatus(ui.invalid); return }
    if (!feedbackService.available) { setStatus(ui.unavailable); return }
    try { await feedbackService.submit({ email, message }); setStatus(ui.sent) } catch { setStatus(ui.failed) }
  }
  return <form className="feedback-form" onSubmit={(event) => void submit(event)}><label>{ui.email}<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>{ui.message}<textarea value={message} onChange={(event) => setMessage(event.target.value)} minLength={10} required /></label><label>{ui.challenge}<input inputMode="numeric" value={challenge} onChange={(event) => setChallenge(event.target.value)} required /></label><button className="primary-button" type="submit">{ui.send}</button>{status && <p role="status">{status}</p>}</form>
}
