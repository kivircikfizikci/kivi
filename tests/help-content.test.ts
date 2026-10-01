import assert from 'node:assert/strict'
import test from 'node:test'
import { commandRegistry } from '../src/commands/commandRegistry.ts'
import {
  developerSupportEmail,
  helpArticleForPath,
  helpArticlesForLocale,
  helpLocaleForSetting,
  helpManifest,
  helpPath,
  helpUi,
  validateHelpManifest,
  type HelpArticleId,
} from '../src/help/helpContent.ts'

const currentTools = ['line', 'rectangle', 'circle', 'arc', 'dimensions', 'selection', 'layers', 'move', 'copy', 'repeat', 'rotate', 'mirror', 'offset', 'trim', 'extend'] as const satisfies readonly HelpArticleId[]

test('English and Turkish Help navigation have exact article and route parity', () => {
  const en = helpArticlesForLocale('en')
  const tr = helpArticlesForLocale('tr')
  assert.equal(en.length, tr.length)
  assert.equal(en.length, 33)
  assert.deepEqual(en.map((item) => item.id), tr.map((item) => item.id))
  assert.deepEqual(en.map(helpPath), tr.map(helpPath))
  assert.deepEqual(validateHelpManifest(), [])
})

test('Help language follows app language and falls back to English', () => {
  assert.equal(helpLocaleForSetting('tr'), 'tr')
  assert.equal(helpLocaleForSetting('en'), 'en')
  assert.equal(helpLocaleForSetting(undefined), 'en')
  assert.equal(helpArticleForPath('/help/getting-started', 'en').title, 'Getting Started')
  assert.equal(helpArticleForPath('/help/getting-started', 'tr').title, 'Başlarken')
})

test('all current tool articles and logical nested routes resolve', () => {
  const ids = new Set(helpManifest.map((article) => article.id))
  for (const id of currentTools) assert.equal(ids.has(id), true, `Missing Help article: ${id}`)
  assert.equal(helpArticleForPath('/help/drawing/rectangle').id, 'rectangle')
  assert.equal(helpArticleForPath('/help/modify/mirror').id, 'mirror')
  assert.equal(helpArticleForPath('/help/export').id, 'export-sharing')
})

test('command Help is registry-driven and the registry contains every shipped command', () => {
  assert.equal(helpManifest.find((article) => article.id === 'commands')?.kind, 'commands')
  assert.deepEqual(commandRegistry.map((command) => command.id), ['line', 'rectangle', 'circle', 'arc', 'dim', 'delete', 'select', 'move', 'copy', 'repeat', 'rotate', 'mirror', 'offset', 'trim', 'extend', 'settings', 'layers', 'undo', 'redo', 'projects', 'fullscreen', 'share'])
  assert.deepEqual(commandRegistry.find((command) => command.id === 'repeat')?.aliases, ['array', 'rep'])
  assert.deepEqual(commandRegistry.find((command) => command.id === 'dim')?.aliases, ['dimension', 'd'])
})

test('release notes, support and feedback are bilingual and honest about unavailable services', () => {
  for (const locale of ['en', 'tr'] as const) {
    const release = helpArticleForPath('/help/release-notes', locale)
    const sharing = helpArticleForPath('/help/export', locale)
    assert.ok(release.sections.length >= 4)
    assert.match(release.sections[0]!.heading, /0\.1\.4/)
    assert.equal(sharing.sections.length, 3)
    assert.ok(helpUi[locale].unavailable.length > 20)
  }
  assert.match(helpArticleForPath('/help/export', 'en').sections[2]!.paragraphs![0]!, /not active/)
  assert.match(helpArticleForPath('/help/projects', 'en').sections[2]!.paragraphs![0]!, /not available/)
  assert.equal(helpArticleForPath('/help/support', 'tr').title, 'Destek')
  assert.match(developerSupportEmail, /^[^@]+@[^@]+\.[^@]+$/)
})
