import { create } from 'zustand'

// Global loading-spinner state — the React equivalent of Angular's LoaderService
// (`toggle(boolean)`), consumed by the GlobalLoader overlay.
type LoaderState = {
  visible: boolean
  show: () => void
  hide: () => void
  toggle: (v: boolean) => void
}

export const useLoader = create<LoaderState>((set) => ({
  visible: false,
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
  toggle: (v) => set({ visible: v }),
}))
