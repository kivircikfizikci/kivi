import type { Entity } from '../entities/Entity.ts'
import type { Camera } from '../camera/Camera.ts'
import type { ViewportSize } from '../camera/coordinateTransforms.ts'
import type { ProjectSettings } from '../../types/project.ts'
import { LineRenderer } from './LineRenderer.tsx'
import { RectangleRenderer } from './RectangleRenderer.tsx'
import { CircleRenderer } from './CircleRenderer.tsx'
import { ArcRenderer } from './ArcRenderer.tsx'
import { DimensionRenderer } from './DimensionRenderer.tsx'
import { resolveDimensionSegment } from '../geometry/dimension.ts'

export function TransformPreviewRenderer({ entities, camera, viewport, settings }: { entities: readonly Entity[]; camera: Camera; viewport: ViewportSize; settings: ProjectSettings }) {
  return <g className="transform-preview" pointerEvents="none">{entities.map((entity) => {
    if (entity.type === 'line') return <LineRenderer key={entity.id} line={entity} camera={camera} viewport={viewport} selected={false} />
    if (entity.type === 'rectangle') return <RectangleRenderer key={entity.id} rectangle={entity} camera={camera} viewport={viewport} preview />
    if (entity.type === 'circle') return <CircleRenderer key={entity.id} circle={entity} camera={camera} viewport={viewport} preview />
    if (entity.type === 'arc') return <ArcRenderer key={entity.id} arc={entity} camera={camera} viewport={viewport} preview />
    const segment = resolveDimensionSegment(entity, entities)
    return segment ? <DimensionRenderer key={entity.id} dimension={entity} segment={segment} camera={camera} viewport={viewport} settings={settings} preview /> : null
  })}</g>
}
