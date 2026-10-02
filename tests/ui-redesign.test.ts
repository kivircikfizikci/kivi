import assert from 'node:assert/strict'
import test from 'node:test'
import { InactiveFeedbackService, validateFeedback } from '../src/feedback/FeedbackService.ts'
import { helpArticleForPath, helpArticles, helpArticlesForLocale, validateHelpManifest } from '../src/help/helpContent.ts'
import { defaultProjectName, projectFileName, recentProjects } from '../src/project/projectPresentation.ts'
import type { Project } from '../src/types/project.ts'
import { precisionCrosshairTools } from '../src/drawing/precisionCrosshair.ts'
import { settingsPresentationForWidth, settingsTabs } from '../src/ui/Settings/settingsLayout.ts'
import { editorHeaderRows, editorModifyActions, editorPrimaryLayout, editorResponsiveLayout, editorToolGroups } from '../src/ui/TopBar/editorLayout.ts'

function project(id: string, updatedAt: string): Project {
  return { id, name: id, updatedAt } as Project
}

test('project presentation localizes new .kivi drawings without duplicating extensions', () => {
  assert.equal(defaultProjectName('en'), 'untitled_project.kivi')
  assert.equal(defaultProjectName('tr'), 'adsız_proje.kivi')
  assert.equal(projectFileName('site plan'), 'site plan.kivi')
  assert.equal(projectFileName('site.KIVI'), 'site.KIVI')
})

test('hub recents are newest-first and limited to five', () => {
  const items = Array.from({ length: 7 }, (_, index) => project(String(index), new Date(2026, 0, index + 1).toISOString()))
  assert.deepEqual(recentProjects(items).map((item) => item.id), ['6', '5', '4', '3', '2'])
})

test('editor layout keeps history centered, global actions right, and all tools categorized', () => {
  assert.deepEqual(editorHeaderRows, ['primary', 'tools'])
  assert.deepEqual(editorResponsiveLayout.desktop.primaryZones, ['project', 'historyAndShortcuts', 'globalActions'])
  assert.deepEqual(editorResponsiveLayout.mobile.primaryZones, ['logo', 'historyAndShortcuts', 'compactActions'])
  assert.deepEqual(editorResponsiveLayout.mobile.fixedCenterActions, ['undo', 'redo', 'delete'])
  assert.deepEqual(editorResponsiveLayout.mobile.compactActions, ['settings', 'account', 'more'])
  assert.deepEqual(editorResponsiveLayout.mobile.moreActions, ['projects', 'share', 'layers', 'help'])
  assert.deepEqual(editorResponsiveLayout.mobile.toolGroups, ['draw', 'dimensionTools', 'modify'])
  assert.equal(editorResponsiveLayout.mobile.bottomToolDrawer, false)
  assert.equal(editorResponsiveLayout.mobile.projectAccess, 'more')
  assert.equal(editorResponsiveLayout.mobile.logoTarget, 'home')
  assert.equal(editorResponsiveLayout.mobile.fullscreen, 'floating')
  assert.deepEqual(editorPrimaryLayout.center, ['undo', 'redo'])
  assert.deepEqual(editorPrimaryLayout.right, ['share', 'layers', 'settings', 'help', 'account'])
  assert.deepEqual(editorToolGroups.map((group) => group.id), ['draw', 'dimensionTools', 'modify'])
  const tools = editorToolGroups.flatMap((group) => group.tools.map((tool) => tool.id))
  assert.deepEqual(tools, ['line', 'rectangle', 'circle', 'arc', 'polygon', 'text', 'dimension', 'measure', 'select', 'move', 'copy', 'repeat', 'rotate', 'mirror', 'scale', 'offset', 'trim', 'extend'])
  assert.deepEqual(editorModifyActions, [{ id: 'delete', icon: 'trash' }])
})

test('settings use requested tabs and responsive presentation', () => {
  assert.deepEqual(settingsTabs, ['preferences', 'shortcuts', 'canvas', 'textSettings', 'dimensions', 'snap'])
  assert.equal(settingsPresentationForWidth(390), 'fullscreen')
  assert.equal(settingsPresentationForWidth(1200), 'modal')
})

test('help routes resolve maintainable articles including release notes', () => {
  assert.equal(helpArticleForPath('/help').id, 'home')
  assert.equal(helpArticleForPath('/help/release-notes').id, 'release-notes')
  assert.equal(helpArticleForPath('/help/drawing/line').id, 'line')
  assert.equal(helpArticleForPath('/help/modify/extend', 'tr').title, 'Uzat')
  assert.ok(helpArticles.some((article) => article.id === 'layers'))
  assert.ok(helpArticles.some((article) => article.id === 'commands'))
  assert.deepEqual(validateHelpManifest(), [])
  assert.deepEqual(helpArticlesForLocale('en').map((article) => article.id), helpArticlesForLocale('tr').map((article) => article.id))
})

test('feedback validates locally and inactive service never fakes a submission', async () => {
  assert.deepEqual(validateFeedback({ email: 'invalid', message: 'short' }, '6'), { email: 'email', message: 'message', challenge: 'challenge' })
  assert.deepEqual(validateFeedback({ email: 'user@example.com', message: 'A useful feedback message.' }, '7'), {})
  const service = new InactiveFeedbackService()
  assert.equal(service.available, false)
  await assert.rejects(service.submit({ email: 'user@example.com', message: 'A useful feedback message.' }))
})

test('precision crosshair is limited to drawing and measurement workflows', () => {
  assert.equal(precisionCrosshairTools.has('line'), true)
  assert.equal(precisionCrosshairTools.has('dimension'), true)
  assert.equal(precisionCrosshairTools.has('polygon'), true)
  assert.equal(precisionCrosshairTools.has('measure'), true)
  assert.equal(precisionCrosshairTools.has('text'), true)
  assert.equal(precisionCrosshairTools.has('scale'), true)
  assert.equal(precisionCrosshairTools.has('select'), false)
  assert.equal(precisionCrosshairTools.has('move'), false)
})
