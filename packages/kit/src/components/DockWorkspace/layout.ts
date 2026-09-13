export type DockSide = 'left' | 'right'
export interface DockLayout {
  columns: Record<DockSide, string[]>
  widths: Record<DockSide, number>
  hidden: Record<DockSide, boolean>
  folded: Record<string, boolean>
  weights: Record<string, number>
}
export interface DockState { layout: DockLayout; solo: Partial<Record<DockSide, string>> }
export type DockAction =
  | { type: 'move'; id: string; side: DockSide; before?: string }
  | { type: 'fold'; id: string }
  | { type: 'dock'; side: DockSide; hidden: boolean }
  | { type: 'fill'; side: DockSide; id?: string }
  | { type: 'width'; side: DockSide; width: number }
  | { type: 'weights'; weights: Record<string, number> }
  | { type: 'cancel' }

export function dockReducer(state: DockState, action: DockAction): DockState {
  const { layout } = state
  switch (action.type) {
    case 'cancel': return state
    case 'move': {
      if (action.id === action.before || ![...layout.columns.left, ...layout.columns.right].includes(action.id)) return state
      const columns = { left: layout.columns.left.filter(id => id !== action.id), right: layout.columns.right.filter(id => id !== action.id) }
      const index = action.before ? columns[action.side].indexOf(action.before) : -1
      columns[action.side].splice(index < 0 ? columns[action.side].length : index, 0, action.id)
      return { layout: { ...layout, columns }, solo: {} }
    }
    case 'fold': return { layout: { ...layout, folded: { ...layout.folded, [action.id]: Object.values(state.solo).includes(action.id) || !layout.folded[action.id] } }, solo: {} }
    case 'dock': return { ...state, layout: { ...layout, hidden: { ...layout.hidden, [action.side]: action.hidden } } }
    case 'fill': return { layout: { ...layout, hidden: { ...layout.hidden, [action.side]: false } }, solo: { ...state.solo, [action.side]: action.id } }
    case 'width': return Number.isFinite(action.width) ? { ...state, layout: { ...layout, widths: { ...layout.widths, [action.side]: Math.max(220, Math.min(400, action.width)) } } } : state
    case 'weights': return { ...state, layout: { ...layout, weights: { ...layout.weights, ...action.weights } } }
  }
}

export function allocateHeights(ids: string[], weights: Record<string, number>, available: number): Record<string, number> {
  const result: Record<string, number> = {}
  let pending = [...ids], remaining = Math.max(0, available)
  const floor = Math.min(40, remaining / (ids.length || 1))
  while (pending.length) {
    const total = pending.reduce((sum, id) => sum + (weights[id] ?? 1), 0)
    const small = pending.filter(id => remaining * (weights[id] ?? 1) / total < floor)
    if (!small.length) {
      for (const id of pending) result[id] = remaining * (weights[id] ?? 1) / total
      break
    }
    for (const id of small) { result[id] = floor; remaining -= floor }
    pending = pending.filter(id => !small.includes(id))
  }
  return result
}

export function transferHeights(sizes: Record<string, number>, weights: Record<string, number>, first: string, second: string, delta: number) {
  const a = sizes[first] ?? 0, b = sizes[second] ?? 0
  const floor = Math.min(40, a, b)
  const change = Math.max(floor - a, Math.min(b - floor, delta))
  const ids = Object.keys(sizes), pixels = ids.reduce((sum, id) => sum + sizes[id]!, 0)
  if (!pixels) return weights
  const scale = ids.reduce((sum, id) => sum + (weights[id] ?? 1), 0) / pixels
  const result = { ...weights }
  for (const id of ids) result[id] = sizes[id]! * scale
  result[first] = (a + change) * scale
  result[second] = (b - change) * scale
  return result
}

export function dockWidths(layout: DockLayout, available: number): Record<DockSide, number> {
  const left = layout.hidden.left ? 34 : layout.widths.left
  const right = layout.hidden.right ? 34 : layout.widths.right
  const fixed = (layout.hidden.left ? left : 0) + (layout.hidden.right ? right : 0)
  const expanded = (layout.hidden.left ? 0 : left) + (layout.hidden.right ? 0 : right)
  const scale = Math.min(1, Math.max(0, available - 240 - fixed) / (expanded || 1))
  return { left: layout.hidden.left ? left : left * scale, right: layout.hidden.right ? right : right * scale }
}

export function parseDockLayout(value: unknown, defaults: DockLayout): DockLayout {
  if (!value || typeof value !== 'object' || (value as { version?: unknown }).version !== 1) return structuredClone(defaults)
  const input = value as Record<string, unknown>
  const record = (key: string): Record<string, unknown> => input[key] && typeof input[key] === 'object' && !Array.isArray(input[key]) ? input[key] as Record<string, unknown> : {}
  const columns = record('columns'), widths = record('widths'), hidden = record('hidden'), folded = record('folded'), weights = record('weights')
  const next = structuredClone(defaults), known = [...defaults.columns.left, ...defaults.columns.right], seen = new Set<string>()
  for (const side of ['left', 'right'] as const) {
    next.columns[side] = []
    for (const id of Array.isArray(columns[side]) ? columns[side] : []) {
      if (typeof id === 'string' && known.includes(id) && !seen.has(id)) { next.columns[side].push(id); seen.add(id) }
    }
    const width = widths[side]
    if (typeof width === 'number' && Number.isFinite(width)) next.widths[side] = Math.max(220, Math.min(400, width))
    if (typeof hidden[side] === 'boolean') next.hidden[side] = hidden[side]
  }
  for (const side of ['left', 'right'] as const) for (const id of defaults.columns[side]) if (!seen.has(id)) { next.columns[side].push(id); seen.add(id) }
  for (const id of known) {
    if (typeof folded[id] === 'boolean') next.folded[id] = folded[id]
    const weight = weights[id]
    if (typeof weight === 'number' && Number.isFinite(weight) && weight > 0) next.weights[id] = Math.max(0.001, Math.min(10000, weight))
  }
  return next
}
