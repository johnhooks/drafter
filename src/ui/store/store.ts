import { create } from 'zustand'
import * as A from './actions'
import type { State } from './actions'

type Args<F> = F extends (s: State, ...rest: infer R) => State ? R : never

export interface Store extends State {
  dispatch: <K extends keyof typeof A>(action: K, ...args: Args<(typeof A)[K]>) => void
}

export const useStore = create<Store>((set) => ({
  ...A.initialState(),
  dispatch: (action, ...args) =>
    set((s) => (A[action] as (s: State, ...rest: unknown[]) => State)(s, ...(args as unknown[]))),
}))
