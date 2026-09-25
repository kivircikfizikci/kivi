import type { ProjectSettings } from '../../types/project.ts'
import type { LineStyle } from './LineEntity.ts'

export function geometryStyleFromProject(settings: Pick<ProjectSettings, 'lineColor' | 'lineWidth'>): LineStyle {
  return { color: settings.lineColor, width: settings.lineWidth }
}
