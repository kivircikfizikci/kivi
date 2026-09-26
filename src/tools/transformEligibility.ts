import type { Entity } from '../drawing/entities/Entity.ts'
import { entityLayerId } from '../project/layers.ts'
import type { Layer } from '../types/project.ts'

export function canTransformSelection(selectedIds: ReadonlySet<string>, entities: readonly Entity[], layers: readonly Layer[]) {
  if (selectedIds.size === 0) return false
  const layerById = new Map(layers.map((layer) => [layer.id, layer]))
  const selected = entities.filter((entity) => selectedIds.has(entity.id))
  return selected.length === selectedIds.size && selected.every((entity) => {
    const layer = layerById.get(entityLayerId(entity))
    if (!layer?.visible || layer.locked) return false
    return entity.type !== 'dimension' || entity.source.type !== 'entity' || selectedIds.has(entity.source.targetEntityId)
  })
}
