import type { Camera } from '../drawing/camera/Camera.ts'
import type { DrawingState } from '../project/DrawingState.ts'

export const CURRENT_PROJECT_VERSION = 2 as const

export interface ProjectSyncMetadata {
  status: 'local' | 'pending' | 'synced' | 'conflict'
  cloudId: string | null
  localRevision: number
  cloudRevision: number | null
}

export interface ProjectSettings {
  backgroundColor: string
  gridColor: string
  gridEnabled: boolean
  gridSpacing: number
  dimensionDisplayUnit: 'cm' | 'mm'
  showDimensionUnit: boolean
  dimensionColor: string
}

export interface ProjectView {
  camera: Camera
}

export interface Project {
  id: string
  name: string
  version: typeof CURRENT_PROJECT_VERSION
  createdAt: string
  updatedAt: string
  drawing: DrawingState
  projectSettings: ProjectSettings
  view?: ProjectView
  sync: ProjectSyncMetadata
}

export type SyncOperationType = 'create' | 'update' | 'delete'

export interface SyncQueueItem<TPayload = unknown> {
  id: string
  projectId: string
  type: SyncOperationType
  createdAt: string
  payload: TPayload
}
