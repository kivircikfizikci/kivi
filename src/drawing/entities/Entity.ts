import type { LineEntity } from './LineEntity.ts'
import type { DimensionEntity } from './DimensionEntity.ts'

export type Entity = LineEntity | DimensionEntity
export type EntityType = Entity['type']
