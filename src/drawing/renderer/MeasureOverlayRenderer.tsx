import type { Camera } from '../camera/Camera.ts'
import { worldToScreen, type ViewportSize } from '../camera/coordinateTransforms.ts'
import type { Entity } from '../entities/Entity.ts'
import type { Point } from '../geometry/Point.ts'
import { entityMeasureValues, formatMeasureAngle, intersectionAngleGeometry, pointMeasurement } from '../geometry/measure.ts'
import { formatDimension } from '../geometry/formatDimension.ts'
import type { ProjectSettings } from '../../types/project.ts'
import type { MeasureToolSnapshot } from '../../tools/MeasureTool.ts'
import { useI18n } from '../../i18n/I18nContext.ts'
import type { TranslationKey } from '../../i18n/types.ts'

export function MeasureOverlayRenderer({ snapshot, entities, camera, viewport, settings }: { snapshot: MeasureToolSnapshot; entities: readonly Entity[]; camera: Camera; viewport: ViewportSize; settings: ProjectSettings }) {
  const first = snapshot.firstEntity ? entities.find((entity) => entity.id === snapshot.firstEntity!.entityId) : null
  if (snapshot.firstPoint && snapshot.secondPoint) {
    const a = worldToScreen(snapshot.firstPoint, camera, viewport)
    const b = worldToScreen(snapshot.secondPoint, camera, viewport)
    const value = pointMeasurement(snapshot.firstPoint, snapshot.secondPoint)
    return <g className="measure-overlay" pointerEvents="none">
      <line className="measure-helper" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
      <circle className="measure-marker" cx={a.x} cy={a.y} r="4" /><circle className="measure-marker" cx={b.x} cy={b.y} r="4" />
      <MeasureCard anchor={midpoint(a, b)} viewport={viewport} rows={[
        ['distance', formatDimension(value.distance, settings)],
        ['deltaX', formatSignedLength(value.deltaX, settings)],
        ['deltaY', formatSignedLength(value.deltaY, settings)],
        ['angle', formatMeasureAngle(value.angle)],
      ]} />
    </g>
  }
  if (snapshot.firstEntity?.segment && snapshot.secondEntity?.segment) {
    const firstSegment = snapshot.firstEntity.segment
    const secondSegment = snapshot.secondEntity.segment
    const angle = intersectionAngleGeometry(firstSegment, secondSegment)
    const a1 = worldToScreen(firstSegment.start, camera, viewport); const a2 = worldToScreen(firstSegment.end, camera, viewport)
    const b1 = worldToScreen(secondSegment.start, camera, viewport); const b2 = worldToScreen(secondSegment.end, camera, viewport)
    const anchor = angle.intersection ? worldToScreen(angle.intersection, camera, viewport) : midpoint(midpoint(a1, a2), midpoint(b1, b2))
    const labels: [string, string][] = angle.parallel
      ? [['parallel', '']]
      : Math.abs(angle.angle - angle.supplementary) < 1e-8
        ? [['angle', formatMeasureAngle(angle.angle)]]
        : [['angle', formatMeasureAngle(angle.angle)], ['supplementaryAngle', formatMeasureAngle(angle.supplementary)]]
    return <g className="measure-overlay" pointerEvents="none">
      <line className="measure-helper" x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y} /><line className="measure-helper" x1={b1.x} y1={b1.y} x2={b2.x} y2={b2.y} />
      {!angle.parallel && <AngleArc center={anchor} first={{ x: a2.x - a1.x, y: a2.y - a1.y }} second={{ x: b2.x - b1.x, y: b2.y - b1.y }} />}
      <MeasureCard anchor={{ x: anchor.x + 34, y: anchor.y + 34 }} viewport={viewport} rows={labels} />
    </g>
  }
  if (first) {
    const anchor = entityAnchor(first, camera, viewport)
    const rows = entityMeasureValues(first).map((item) => [item.label, item.kind === 'length' ? formatDimension(item.value, settings) : item.kind === 'angle' ? formatMeasureAngle(item.value) : String(item.value)] as [string, string])
    return <g className="measure-overlay" pointerEvents="none"><MeasureCard anchor={anchor} viewport={viewport} rows={rows} /></g>
  }
  if (snapshot.firstPoint) {
    const point = worldToScreen(snapshot.firstPoint, camera, viewport)
    return <g className="measure-overlay" pointerEvents="none"><circle className="measure-marker" cx={point.x} cy={point.y} r="4" /></g>
  }
  return null
}

function MeasureCard({ anchor, viewport, rows }: { anchor: Point; viewport: ViewportSize; rows: [string, string][] }) {
  const { t } = useI18n()
  const width = Math.min(180, Math.max(120, viewport.width - 16))
  const height = Math.max(42, rows.length * 24 + 16)
  const x = Math.max(8, Math.min(anchor.x + 12, viewport.width - width - 8))
  const y = Math.max(8, Math.min(anchor.y + 12, viewport.height - height - 8))
  return <foreignObject x={x} y={y} width={width} height={height}>
    <div className="measure-card">{rows.map(([label, value]) => <div key={label}><span>{t(label as TranslationKey)}</span><strong>{value}</strong></div>)}</div>
  </foreignObject>
}

function AngleArc({ center, first, second }: { center: Point; first: Point; second: Point }) {
  const start = Math.atan2(first.y, first.x)
  let delta = Math.atan2(second.y, second.x) - start
  while (delta > Math.PI / 2) delta -= Math.PI
  while (delta < -Math.PI / 2) delta += Math.PI
  const radius = 25
  const from = { x: center.x + Math.cos(start) * radius, y: center.y + Math.sin(start) * radius }
  const to = { x: center.x + Math.cos(start + delta) * radius, y: center.y + Math.sin(start + delta) * radius }
  return <path className="measure-angle-arc" d={`M ${from.x} ${from.y} A ${radius} ${radius} 0 0 ${delta >= 0 ? 1 : 0} ${to.x} ${to.y}`} />
}

function entityAnchor(entity: Entity, camera: Camera, viewport: ViewportSize) {
  if (entity.type === 'line') return midpoint(worldToScreen(entity.start, camera, viewport), worldToScreen(entity.end, camera, viewport))
  if (entity.type === 'dimension') return { x: viewport.width / 2, y: viewport.height / 2 }
  return worldToScreen(entity.type === 'rectangle' ? entity.origin : entity.center, camera, viewport)
}
function midpoint(a: Point, b: Point) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }
function formatSignedLength(value: number, settings: ProjectSettings) { const formatted = formatDimension(Math.abs(value), settings); return `${value < 0 ? '−' : '+'}${formatted}` }
