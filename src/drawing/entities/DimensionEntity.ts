export interface DimensionEntity {
  id: string
  type: 'dimension'
  targetEntityId: string
  offset: number
  side: 1 | -1
  style: {
    color?: string
    textSize?: number
  }
}

export function createDimensionEntity(targetEntityId: string, offset: number, side: 1 | -1): DimensionEntity {
  return { id: globalThis.crypto.randomUUID(), type: 'dimension', targetEntityId, offset, side, style: {} }
}
