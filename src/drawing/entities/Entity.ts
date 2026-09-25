import type { LineEntity } from './LineEntity.ts'
import type { DimensionEntity } from './DimensionEntity.ts'
import type { RectangleEntity } from './RectangleEntity.ts'
import type { CircleEntity } from './CircleEntity.ts'
import type { ArcEntity } from './ArcEntity.ts'

export type Entity = LineEntity | DimensionEntity | RectangleEntity | CircleEntity | ArcEntity
export type EntityType = Entity['type']
