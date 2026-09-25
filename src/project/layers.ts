import type { Entity } from '../drawing/entities/Entity.ts'
import type { Layer } from '../types/project.ts'

export const DEFAULT_LAYER_ID = 'default'
export const DIMENSIONS_LAYER_ID = 'dimensions'

export function entityLayerId(entity: Pick<Entity, 'type' | 'layerId'>) {
  return entity.layerId ?? (entity.type === 'dimension' ? DIMENSIONS_LAYER_ID : DEFAULT_LAYER_ID)
}

export function createBuiltInLayers(): Layer[] {
  return [
    { id: DEFAULT_LAYER_ID, name: 'Default', visible: true, locked: false, builtIn: true },
    { id: DIMENSIONS_LAYER_ID, name: 'Dimensions', visible: true, locked: false, builtIn: true },
  ]
}

export function entitiesOnVisibleLayers(entities: readonly Entity[], layers: readonly Layer[]) {
  const visible = new Set(layers.filter((layer) => layer.visible).map((layer) => layer.id))
  return entities.filter((entity) => visible.has(entityLayerId(entity)))
}

export function entitiesOnSelectableLayers(entities: readonly Entity[], layers: readonly Layer[]) {
  const selectable = new Set(layers.filter((layer) => layer.visible && !layer.locked).map((layer) => layer.id))
  return entities.filter((entity) => selectable.has(entityLayerId(entity)))
}

export function isEditableLayer(layer: Layer | undefined) {
  return Boolean(layer?.visible && !layer.locked && layer.id !== DIMENSIONS_LAYER_ID)
}
