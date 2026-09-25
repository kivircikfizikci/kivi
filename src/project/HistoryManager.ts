export class HistoryManager<T> {
  private undoStack: T[] = []
  private redoStack: T[] = []

  push(previous: T) {
    this.undoStack.push(previous)
    this.redoStack = []
  }

  undo(current: T): T | null {
    const previous = this.undoStack.pop()
    if (previous === undefined) return null
    this.redoStack.push(current)
    return previous
  }

  redo(current: T): T | null {
    const next = this.redoStack.pop()
    if (next === undefined) return null
    this.undoStack.push(current)
    return next
  }

  rewrite(mapper: (value: T) => T) {
    this.undoStack = this.undoStack.map(mapper)
    this.redoStack = this.redoStack.map(mapper)
  }

  get canUndo() {
    return this.undoStack.length > 0
  }

  get canRedo() {
    return this.redoStack.length > 0
  }
}
