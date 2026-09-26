import type { TranslationKey } from '../i18n/types.ts'
import type { ToolId } from '../tools/Tool.ts'

export interface CommandContext {
  activateTool: (tool: ToolId) => void
  deleteSelection: () => void
  undo: () => void
  redo: () => void
  openProjects: () => void
  openSettings: () => void
  openLayers: () => void
  enterFullscreen: () => void
  openShare: () => void
}

export interface AppCommand {
  id: string
  labelKey: TranslationKey
  aliases: readonly string[]
  execute: (context: CommandContext) => void
}

export const commandRegistry: readonly AppCommand[] = [
  { id: 'line', labelKey: 'line', aliases: ['l'], execute: (context) => context.activateTool('line') },
  { id: 'rectangle', labelKey: 'rectangle', aliases: ['rect'], execute: (context) => context.activateTool('rectangle') },
  { id: 'circle', labelKey: 'circle', aliases: ['c'], execute: (context) => context.activateTool('circle') },
  { id: 'arc', labelKey: 'arc', aliases: ['a'], execute: (context) => context.activateTool('arc') },
  { id: 'dim', labelKey: 'dimension', aliases: ['dimension', 'd'], execute: (context) => context.activateTool('dimension') },
  { id: 'delete', labelKey: 'delete', aliases: ['del'], execute: (context) => context.deleteSelection() },
  { id: 'select', labelKey: 'select', aliases: ['s'], execute: (context) => context.activateTool('select') },
  { id: 'move', labelKey: 'move', aliases: ['m'], execute: (context) => context.activateTool('move') },
  { id: 'copy', labelKey: 'copy', aliases: ['cp'], execute: (context) => context.activateTool('copy') },
  { id: 'repeat', labelKey: 'repeat', aliases: ['array', 'rep'], execute: (context) => context.activateTool('repeat') },
  { id: 'settings', labelKey: 'settings', aliases: ['preferences'], execute: (context) => context.openSettings() },
  { id: 'layers', labelKey: 'layers', aliases: ['layer'], execute: (context) => context.openLayers() },
  { id: 'undo', labelKey: 'undo', aliases: [], execute: (context) => context.undo() },
  { id: 'redo', labelKey: 'redo', aliases: [], execute: (context) => context.redo() },
  { id: 'projects', labelKey: 'projects', aliases: ['project'], execute: (context) => context.openProjects() },
  { id: 'fullscreen', labelKey: 'fullscreen', aliases: ['full'], execute: (context) => context.enterFullscreen() },
  { id: 'share', labelKey: 'share', aliases: [], execute: (context) => context.openShare() },
]

const commonCommandIds = new Set(['line', 'dim', 'select'])

export function getCommandSuggestions(query: string, labelFor: (key: TranslationKey) => string = (key) => key, limit = 5) {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) return commandRegistry.filter((command) => commonCommandIds.has(command.id))

  return commandRegistry
    .map((command, index) => ({ command, index, rank: suggestionRank(command, normalized, labelFor) }))
    .filter((match) => match.rank < Number.POSITIVE_INFINITY)
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .slice(0, limit)
    .map((match) => match.command)
}

export function resolveCommand(input: string) {
  const normalized = input.trim().toLocaleLowerCase()
  return commandRegistry.find((command) => command.id === normalized || command.aliases.includes(normalized))
}

export function executeCommand(input: string, context: CommandContext) {
  const command = resolveCommand(input)
  if (!command) return false
  command.execute(context)
  return true
}

function suggestionRank(command: AppCommand, query: string, labelFor: (key: TranslationKey) => string) {
  if (command.id === query) return 0
  if (command.aliases.includes(query)) return 1
  if (command.id.startsWith(query)) return 2
  if (command.aliases.some((alias) => alias.startsWith(query))) return 3
  if (labelFor(command.labelKey).toLocaleLowerCase().startsWith(query)) return 4
  return Number.POSITIVE_INFINITY
}
