import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeDesktopToolbarShortcuts,
  normalizeMobileToolbarShortcuts,
  toggleToolbarShortcut,
} from '../src/types/settings.ts'

test('mobile toolbar shortcuts keep a maximum of three unique supported actions', () => {
  assert.deepEqual(
    normalizeMobileToolbarShortcuts(['undo', 'undo', 'copy', 'invalid', 'redo', 'select']),
    ['undo', 'copy', 'redo'],
  )
  assert.deepEqual(normalizeMobileToolbarShortcuts(undefined), ['select', 'move', 'copy'])
})

test('desktop toolbar shortcuts preserve supported actions and default to undo and redo', () => {
  assert.deepEqual(normalizeDesktopToolbarShortcuts(undefined), ['undo', 'redo'])
  assert.deepEqual(normalizeDesktopToolbarShortcuts(['select', 'invalid', 'copy', 'select']), ['select', 'copy'])
})

test('mobile toolbar shortcut selection can remove, append, and enforce its limit', () => {
  assert.deepEqual(toggleToolbarShortcut(['select', 'move'], 'undo', 3), ['select', 'move', 'undo'])
  assert.deepEqual(toggleToolbarShortcut(['select', 'move', 'undo'], 'copy', 3), ['select', 'move', 'undo'])
  assert.deepEqual(toggleToolbarShortcut(['select', 'move', 'undo'], 'move', 3), ['select', 'undo'])
})
