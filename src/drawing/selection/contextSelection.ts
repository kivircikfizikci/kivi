export function selectionForContextTarget(selectedIds: ReadonlySet<string>, targetId: string) {
  return selectedIds.has(targetId) ? new Set(selectedIds) : new Set([targetId])
}
