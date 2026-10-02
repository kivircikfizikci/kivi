import type { Camera } from '../camera/Camera.ts'
import { worldToScreen, type ViewportSize } from '../camera/coordinateTransforms.ts'
import type { Entity } from '../entities/Entity.ts'
import type { Point } from '../geometry/Point.ts'
import { arcToSvgPath } from '../geometry/arc.ts'
import { entityMeasureValues, formatMeasureAngle, type MeasurePrimitive, type MeasureRelationship } from '../geometry/measure.ts'
import { formatDimension } from '../geometry/formatDimension.ts'
import type { ProjectSettings } from '../../types/project.ts'
import type { MeasureToolSnapshot } from '../../tools/MeasureTool.ts'
import { useI18n } from '../../i18n/I18nContext.ts'
import type { TranslationKey } from '../../i18n/types.ts'

export function MeasureOverlayRenderer({ snapshot, entities, camera, viewport, settings }: { snapshot: MeasureToolSnapshot; entities: readonly Entity[]; camera: Camera; viewport: ViewportSize; settings: ProjectSettings }) {
  const inspection = snapshot.inspection
  if (!inspection?.candidates.length) return null
  const primary = inspection.candidates[0]!
  const primaryEntity = entities.find((entity) => entity.id === primary.primitive.entityId)
  const mobile = snapshot.source === 'tap'
  const values = primaryEntity ? entityMeasureValues(primaryEntity) : []
  const rows = values
    .filter((item) => !mobile || item.label === 'angle' || item.label === 'length' || item.label === 'radius' || item.label === 'sweepAngle' || item.label === 'sideLength')
    .slice(0, mobile ? 2 : 4)
    .map((item) => [item.label, item.kind === 'length' ? formatDimension(item.value, settings) : item.kind === 'angle' ? formatMeasureAngle(item.value) : String(item.value)] as [string, string])
  const cardAnchor = worldToScreen(primary.nearestPoint, camera, viewport)

  return <g className="measure-overlay" pointerEvents="none">
    {inspection.candidates.map((candidate, index) => <PrimitiveHighlight key={candidate.primitive.key} primitive={candidate.primitive} camera={camera} viewport={viewport} primary={index === 0} />)}
    <circle className="measure-inspection-anchor" cx={worldToScreen(inspection.anchor, camera, viewport).x} cy={worldToScreen(inspection.anchor, camera, viewport).y} r="3" />
    {inspection.relationship && <RelationshipOverlay relationship={inspection.relationship} camera={camera} viewport={viewport} settings={settings} mobile={mobile} />}
    {rows.length > 0 && inspection.relationship?.kind !== 'segment-angle' && <MeasureCard anchor={cardAnchor} viewport={viewport} rows={rows} compact={mobile} />}
  </g>
}

function PrimitiveHighlight({ primitive, camera, viewport, primary }: { primitive: MeasurePrimitive; camera: Camera; viewport: ViewportSize; primary: boolean }) {
  const className = `measure-highlight${primary ? ' is-primary' : ''}`
  if (primitive.kind === 'segment') {
    const start = worldToScreen(primitive.segment.start, camera, viewport); const end = worldToScreen(primitive.segment.end, camera, viewport)
    return <line className={className} x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
  }
  if (primitive.kind === 'circle') {
    const center = worldToScreen(primitive.center, camera, viewport)
    return <circle className={className} cx={center.x} cy={center.y} r={primitive.radius * camera.zoom} />
  }
  return <path className={className} d={arcToSvgPath(primitive, (point) => worldToScreen(point, camera, viewport), camera.zoom, true)} />
}

function RelationshipOverlay({ relationship, camera, viewport, settings, mobile }: { relationship: MeasureRelationship; camera: Camera; viewport: ViewportSize; settings: ProjectSettings; mobile: boolean }) {
  if (relationship.kind === 'segment-angle') return <AngleRelationship relationship={relationship} camera={camera} viewport={viewport} mobile={mobile} />
  const start = worldToScreen(relationship.start, camera, viewport); const end = worldToScreen(relationship.end, camera, viewport)
  const anchor = midpoint(start, end)
  const rows: [string, string][] = relationship.parallel
    ? [['parallel', ''], ['distance', formatDimension(relationship.distance, settings)]]
    : [['distance', formatDimension(relationship.distance, settings)]]
  return <>
    {!relationship.intersects && <line className="measure-helper" x1={start.x} y1={start.y} x2={end.x} y2={end.y} />}
    <circle className="measure-marker" cx={start.x} cy={start.y} r="3" /><circle className="measure-marker" cx={end.x} cy={end.y} r="3" />
    {!relationship.intersects && <MeasureCard anchor={anchor} viewport={viewport} rows={rows.slice(0, mobile ? 1 : 2)} compact={mobile} />}
  </>
}

function AngleRelationship({ relationship, camera, viewport, mobile }: { relationship: Extract<MeasureRelationship, { kind: 'segment-angle' }>; camera: Camera; viewport: ViewportSize; mobile: boolean }) {
  const center = worldToScreen(relationship.focus, camera, viewport)
  const first = worldVectorToScreen(relationship.first.segment)
  const second = worldVectorToScreen(relationship.second.segment)
  const start = Math.atan2(first.y, first.x)
  let signedAcute = Math.atan2(second.y, second.x) - start
  while (signedAcute > Math.PI / 2) signedAcute -= Math.PI
  while (signedAcute < -Math.PI / 2) signedAcute += Math.PI
  const acute = arcGeometry(center, start, signedAcute, 28)
  const supplementaryDelta = signedAcute >= 0 ? signedAcute - Math.PI : signedAcute + Math.PI
  const supplementary = arcGeometry(center, start, supplementaryDelta, 42)
  return <g className="measure-angle-relationship">
    <line className="measure-helper" x1={center.x - first.x * 80} y1={center.y - first.y * 80} x2={center.x + first.x * 80} y2={center.y + first.y * 80} />
    <line className="measure-helper" x1={center.x - second.x * 80} y1={center.y - second.y * 80} x2={center.x + second.x * 80} y2={center.y + second.y * 80} />
    <path className="measure-angle-arc" d={acute.path} />
    <text className="measure-angle-label" x={acute.label.x} y={acute.label.y}>{formatMeasureAngle(relationship.measurement.angle)}</text>
    {!mobile && Math.abs(relationship.measurement.angle - relationship.measurement.supplementary) > 1e-8 && <>
      <path className="measure-angle-arc secondary" d={supplementary.path} />
      <text className="measure-angle-label secondary" x={supplementary.label.x} y={supplementary.label.y}>{formatMeasureAngle(relationship.measurement.supplementary)}</text>
    </>}
  </g>
}

function MeasureCard({ anchor, viewport, rows, compact = false }: { anchor: Point; viewport: ViewportSize; rows: [string, string][]; compact?: boolean }) {
  const { t } = useI18n()
  const width = Math.min(compact ? 150 : 180, Math.max(116, viewport.width - 16))
  const height = Math.max(38, rows.length * 24 + 14)
  const x = Math.max(8, Math.min(anchor.x + 12, viewport.width - width - 8))
  const y = Math.max(8, Math.min(anchor.y + 12, viewport.height - height - 8))
  return <foreignObject x={x} y={y} width={width} height={height}>
    <div className="measure-card">{rows.map(([label, value]) => <div key={label}><span>{t(label as TranslationKey)}</span><strong>{value}</strong></div>)}</div>
  </foreignObject>
}

function worldVectorToScreen(segment: { start: Point; end: Point }) {
  const x = segment.end.x - segment.start.x
  const y = -(segment.end.y - segment.start.y)
  const length = Math.hypot(x, y) || 1
  return { x: x / length, y: y / length }
}

function arcGeometry(center: Point, start: number, delta: number, radius: number) {
  const from = { x: center.x + Math.cos(start) * radius, y: center.y + Math.sin(start) * radius }
  const to = { x: center.x + Math.cos(start + delta) * radius, y: center.y + Math.sin(start + delta) * radius }
  const middle = start + delta / 2
  return {
    path: `M ${from.x} ${from.y} A ${radius} ${radius} 0 ${Math.abs(delta) > Math.PI ? 1 : 0} ${delta >= 0 ? 1 : 0} ${to.x} ${to.y}`,
    label: { x: center.x + Math.cos(middle) * (radius + 13), y: center.y + Math.sin(middle) * (radius + 13) },
  }
}

function midpoint(a: Point, b: Point) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }
