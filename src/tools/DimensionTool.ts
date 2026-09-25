import type { LineEntity } from '../drawing/entities/LineEntity.ts'
import { createDimensionEntity, type DimensionEntity } from '../drawing/entities/DimensionEntity.ts'
import type { Point } from '../drawing/geometry/Point.ts'
import { dimensionPlacement } from '../drawing/geometry/dimension.ts'
import type { Tool } from './Tool.ts'

export interface DimensionToolSnapshot {
  target: LineEntity | null
  preview: DimensionEntity | null
}

export class DimensionTool implements Tool {
  readonly id = 'dimension' as const
  private snapshot: DimensionToolSnapshot = { target: null, preview: null }
  private readonly listeners = new Set<() => void>()

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.snapshot

  activate() { this.reset() }
  deactivate() { this.reset() }

  chooseTarget(line: LineEntity) {
    this.setSnapshot({ target: line, preview: null })
  }

  position(pointer: Point, minimumOffset: number) {
    const target = this.snapshot.target
    if (!target) return
    const placement = dimensionPlacement(target, pointer, minimumOffset)
    if (!placement) return
    this.setSnapshot({
      target,
      preview: { id: 'preview-dimension', type: 'dimension', targetEntityId: target.id, ...placement, style: {}, layerId: 'dimensions' },
    })
  }

  place(): DimensionEntity | null {
    const preview = this.snapshot.preview
    if (!preview) return null
    const committed = createDimensionEntity(preview.targetEntityId, preview.offset, preview.side)
    this.reset()
    return committed
  }

  private reset() { this.setSnapshot({ target: null, preview: null }) }

  private setSnapshot(snapshot: DimensionToolSnapshot) {
    this.snapshot = snapshot
    this.listeners.forEach((listener) => listener())
  }
}
