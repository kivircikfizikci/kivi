import type { ProjectSettings } from '../types/project.ts'
import type { AppTheme } from '../types/settings.ts'

export type ThemeCanvasColors = Pick<ProjectSettings, 'backgroundColor' | 'gridColor' | 'lineColor'>

const palettes: Record<AppTheme, ThemeCanvasColors> = {
  light: {
    backgroundColor: '#f8faf9',
    gridColor: '#d8dfdc',
    lineColor: '#2f4940',
  },
  dark: {
    backgroundColor: '#101214',
    gridColor: '#343a31',
    lineColor: '#e9fbcb',
  },
}

export function canvasColorsForTheme(theme: AppTheme): ThemeCanvasColors {
  return { ...palettes[theme] }
}
