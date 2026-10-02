import type { Camera } from '../camera/Camera.ts'
import { worldToScreen, type ViewportSize } from '../camera/coordinateTransforms.ts'
import type { TextEntity } from '../entities/TextEntity.ts'
import { wrapText } from '../geometry/text.ts'

export function TextRenderer({ entity, camera, viewport, selected = false, preview = false }: { entity: TextEntity; camera: Camera; viewport: ViewportSize; selected?: boolean; preview?: boolean }) {
  const origin = worldToScreen(entity.position, camera, viewport)
  const width = entity.box.width * camera.zoom
  const height = entity.box.height * camera.zoom
  const decoration = [entity.style.underline ? 'underline' : '', entity.style.strikeThrough ? 'line-through' : ''].filter(Boolean).join(' ') || undefined
  const anchor = entity.style.textAlign === 'center' ? 'middle' : entity.style.textAlign === 'right' ? 'end' : 'start'
  return <g className={preview ? 'shape-preview text-entity' : 'text-entity'} transform={`translate(${origin.x} ${origin.y}) rotate(${-entity.rotation})`} pointerEvents="none">
    <text fill={entity.style.color} fontFamily={`${entity.style.fontFamily}, sans-serif`} fontSize={entity.style.fontSize * camera.zoom} fontWeight={entity.style.fontWeight} fontStyle={entity.style.italic ? 'italic' : 'normal'} textDecoration={decoration} textAnchor={anchor}>
      {wrapText(entity).map((line, index) => <tspan key={`${index}-${line.text}`} x={line.x * camera.zoom} y={line.y * camera.zoom}>{line.text || ' '}</tspan>)}
    </text>
    {selected && <><rect className="text-selection-frame" x="0" y="0" width={width} height={height} /><ResizeHandles width={width} height={height} /></>}
  </g>
}

function ResizeHandles({ width, height }: { width: number; height: number }) {
  return <>{[[0, 0], [width, 0], [width, height], [0, height]].map(([x, y], index) => <rect key={index} className="text-resize-handle" x={x! - 5} y={y! - 5} width="10" height="10" rx="2" />)}</>
}
