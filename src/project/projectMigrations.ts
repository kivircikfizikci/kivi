import { DEFAULT_CAMERA } from '../drawing/camera/Camera.ts'
import { EMPTY_DRAWING_STATE, type DrawingState } from './DrawingState.ts'
import {
  CURRENT_PROJECT_VERSION,
  type Project,
  type ProjectSettings,
  type Layer,
} from '../types/project.ts'
import { generateProjectId } from '../ids/secureId.ts'
import type { Entity } from '../drawing/entities/Entity.ts'
import { createBuiltInLayers, DEFAULT_LAYER_ID, DIMENSIONS_LAYER_ID, isEditableLayer } from './layers.ts'

export function migrateProject(value: unknown): Project {
  if (!isRecord(value)) throw new Error('Invalid project record')

  if (value.version === CURRENT_PROJECT_VERSION && isDrawingState(value.drawing) && isProjectSettings(value.projectSettings) && isLayers(value.layers)) {
    const project = value as unknown as Project
    return {
      ...project,
      drawing: { version: 1, entities: project.drawing.entities },
      projectSettings: { ...defaultProjectSettings(), ...project.projectSettings },
      activeLayerId: resolveActiveLayer(project.layers, project.activeLayerId),
      view: isProjectView(project.view) ? project.view : { camera: structuredClone(DEFAULT_CAMERA) },
      sync: { ...defaultSyncMetadata(), ...(isRecord(project.sync) ? project.sync : {}) },
    }
  }

  if (value.version === 2 && isDrawingState(value.drawing) && isRecord(value.projectSettings)) {
    const project = value as unknown as Omit<Project, 'version' | 'drawing' | 'layers' | 'activeLayerId' | 'projectSettings'> & { drawing: DrawingState; projectSettings: Partial<ProjectSettings> }
    return {
      ...project,
      version: CURRENT_PROJECT_VERSION,
      drawing: { version: 1, entities: assignBuiltInLayers(project.drawing.entities) },
      projectSettings: { ...defaultProjectSettings(), ...project.projectSettings },
      layers: createBuiltInLayers(),
      activeLayerId: DEFAULT_LAYER_ID,
      view: isProjectView(project.view) ? project.view : { camera: structuredClone(DEFAULT_CAMERA) },
      sync: { ...defaultSyncMetadata(), ...(isRecord(project.sync) ? project.sync : {}) },
    }
  }

  // Projects created before semantic geometry tools and project-level dimension color.
  if (value.version === 1 && isDrawingState(value.drawing) && isRecord(value.projectSettings)) {
    const project = value as unknown as Omit<Project, 'version' | 'projectSettings'> & { projectSettings: Partial<ProjectSettings> }
    return {
      ...project,
      version: CURRENT_PROJECT_VERSION,
      drawing: { version: 1, entities: assignBuiltInLayers(project.drawing.entities) },
      projectSettings: { ...defaultProjectSettings(), ...project.projectSettings },
      layers: createBuiltInLayers(),
      activeLayerId: DEFAULT_LAYER_ID,
      view: isProjectView(project.view) ? project.view : { camera: structuredClone(DEFAULT_CAMERA) },
      sync: { ...defaultSyncMetadata(), ...(isRecord(project.sync) ? project.sync : {}) },
    }
  }

  // Boundary for the original foundation model, which stored drawing data under `data`.
  if (value.version === 1 && isDrawingState(value.data)) {
    const now = new Date().toISOString()
    return {
      id: typeof value.id === 'string' ? value.id : generateProjectId(),
      name: typeof value.name === 'string' ? value.name : 'Untitled',
      version: CURRENT_PROJECT_VERSION,
      createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
      updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
      drawing: { version: 1, entities: assignBuiltInLayers(value.data.entities) },
      projectSettings: defaultProjectSettings(),
      layers: createBuiltInLayers(),
      activeLayerId: DEFAULT_LAYER_ID,
      view: { camera: DEFAULT_CAMERA },
      sync: defaultSyncMetadata(),
    }
  }

  throw new Error(`Unsupported project version: ${String(value.version)}`)
}

export function defaultProjectSettings(): ProjectSettings {
  return {
    backgroundColor: '#f8faf9',
    gridColor: '#d8dfdc',
    gridEnabled: true,
    gridSpacing: 10,
    dimensionDisplayUnit: 'cm',
    showDimensionUnit: false,
    dimensionColor: '#315c4c',
    lineColor: '#2f4940',
    lineWidth: 2,
  }
}

export function defaultSyncMetadata(): Project['sync'] {
  return { status: 'local', cloudId: null, localRevision: 0, cloudRevision: null }
}

function isDrawingState(value: unknown): value is DrawingState {
  return isRecord(value) && value.version === EMPTY_DRAWING_STATE.version && Array.isArray(value.entities)
}

function isProjectSettings(value: unknown): value is ProjectSettings {
  return isRecord(value)
    && typeof value.backgroundColor === 'string'
    && typeof value.gridColor === 'string'
    && typeof value.gridEnabled === 'boolean'
    && typeof value.gridSpacing === 'number'
    && typeof value.dimensionColor === 'string'
    && typeof value.lineColor === 'string'
    && typeof value.lineWidth === 'number'
}

function isLayers(value: unknown): value is Layer[] {
  return Array.isArray(value) && value.every((layer) => isRecord(layer)
    && typeof layer.id === 'string'
    && typeof layer.name === 'string'
    && typeof layer.visible === 'boolean'
    && typeof layer.locked === 'boolean')
}

function assignBuiltInLayers(entities: readonly Entity[]): Entity[] {
  return entities.map((entity) => ({
    ...entity,
    layerId: entity.type === 'dimension' ? DIMENSIONS_LAYER_ID : DEFAULT_LAYER_ID,
  }))
}

function resolveActiveLayer(layers: readonly Layer[], requested: unknown) {
  const selected = typeof requested === 'string' ? layers.find((layer) => layer.id === requested) : undefined
  return isEditableLayer(selected) ? selected!.id : (layers.find(isEditableLayer)?.id ?? DEFAULT_LAYER_ID)
}

function isProjectView(value: unknown): value is Project['view'] {
  if (!isRecord(value) || !isRecord(value.camera) || !isRecord(value.camera.center)) return false
  return typeof value.camera.zoom === 'number'
    && typeof value.camera.center.x === 'number'
    && typeof value.camera.center.y === 'number'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
