import type { LineEntity } from './LineEntity.ts'
import type { DimensionEntity } from './DimensionEntity.ts'
import type { RectangleEntity } from './RectangleEntity.ts'
import type { CircleEntity } from './CircleEntity.ts'
import type { ArcEntity } from './ArcEntity.ts'
import type { PolygonEntity } from './PolygonEntity.ts'

export type Entity = LineEntity | DimensionEntity | RectangleEntity | CircleEntity | ArcEntity | PolygonEntity
export type EntityType = Entity['type']
