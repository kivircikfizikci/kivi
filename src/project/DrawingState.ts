import type { Entity } from '../drawing/entities/Entity.ts'

export interface DrawingState {
  version: 1
  entities: readonly Entity[]
}

export const EMPTY_DRAWING_STATE: DrawingState = {
  version: 1,
  entities: [],
}
