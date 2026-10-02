import type { LineEntity } from './LineEntity.ts'
import type { DimensionEntity } from './DimensionEntity.ts'
import type { RectangleEntity } from './RectangleEntity.ts'
import type { CircleEntity } from './CircleEntity.ts'
import type { ArcEntity } from './ArcEntity.ts'
import type { PolygonEntity } from './PolygonEntity.ts'
import type { TextEntity } from './TextEntity.ts'

export type Entity = LineEntity | DimensionEntity | RectangleEntity | CircleEntity | ArcEntity | PolygonEntity | TextEntity
export type EntityType = Entity['type']
