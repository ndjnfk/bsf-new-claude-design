import { create } from 'zustand'
import type { SportMenuItem } from '../types'
import { fetchSports, toMenu } from '../services/sportsApi'

// Sports list for the sidebar, fetched once (Angular kept this in the
// ApiService.sports BehaviorSubject, loaded by getSports()).
type SportsState = {
  sportMenu: SportMenuItem[]
  loaded: boolean
  loadSports: () => Promise<void>
}

export const useSports = create<SportsState>((set, get) => ({
  sportMenu: [],
  loaded: false,
  loadSports: async () => {
    if (get().loaded) return
    try {
      const sports = await fetchSports()
      set({ sportMenu: toMenu(sports), loaded: true })
    } catch {
      set({ loaded: true })
    }
  },
}))
