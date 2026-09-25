import type { DimensionEntity } from '../entities/DimensionEntity.ts'
import type { ProjectSettings } from '../../types/project.ts'

export function resolveDimensionColor(
  dimension: Pick<DimensionEntity, 'style'>,
  settings: Pick<ProjectSettings, 'dimensionColor'>,
) {
  return dimension.style.color ?? settings.dimensionColor
}
