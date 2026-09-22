import type { ProjectSettings } from '../../types/project.ts'

export function formatDimension(lengthCm: number, settings: Pick<ProjectSettings, 'dimensionDisplayUnit' | 'showDimensionUnit'>, precision = 2) {
  const unit = settings.dimensionDisplayUnit
  const value = unit === 'mm' ? lengthCm * 10 : lengthCm
  const rounded = Number(value.toFixed(precision))
  return `${rounded}${settings.showDimensionUnit ? ` ${unit}` : ''}`
}
