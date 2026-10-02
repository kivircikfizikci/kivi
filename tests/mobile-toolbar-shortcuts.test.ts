import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeDesktopToolbarShortcuts,
  normalizeMobileToolbarShortcuts,
  toggleToolbarShortcut,
} from '../src/types/settings.ts'

test('mobile toolbar shortcuts keep a maximum of three unique supported actions', () => {
  assert.deepEqual(
    normalizeMobileToolbarShortcuts(['arc', 'arc', 'copy', 'invalid', 'trim', 'select']),
    ['arc', 'copy', 'trim'],
  )
  assert.deepEqual(normalizeMobileToolbarShortcuts(undefined), ['select', 'move', 'copy'])
  assert.deepEqual(normalizeMobileToolbarShortcuts(['undo', 'redo']), ['select', 'move', 'copy'])
})

test('desktop toolbar shortcuts accept every drawing tool and exclude fixed history actions', () => {
  assert.deepEqual(normalizeDesktopToolbarShortcuts(undefined), ['select', 'move', 'copy'])
  assert.deepEqual(normalizeDesktopToolbarShortcuts(['line', 'dimension', 'rotate', 'offset', 'extend', 'arc']), ['line', 'dimension', 'rotate', 'offset', 'extend'])
  assert.deepEqual(normalizeDesktopToolbarShortcuts(['undo', 'redo']), ['select', 'move', 'copy'])
  assert.deepEqual(normalizeDesktopToolbarShortcuts(['polygon', 'measure']), ['polygon', 'measure'])
})

test('mobile toolbar shortcut selection can remove, append, and enforce its limit', () => {
  assert.deepEqual(toggleToolbarShortcut(['select', 'move'], 'arc', 3), ['select', 'move', 'arc'])
  assert.deepEqual(toggleToolbarShortcut(['select', 'move', 'arc'], 'copy', 3), ['select', 'move', 'arc'])
  assert.deepEqual(toggleToolbarShortcut(['select', 'move', 'arc'], 'move', 3), ['select', 'arc'])
})
