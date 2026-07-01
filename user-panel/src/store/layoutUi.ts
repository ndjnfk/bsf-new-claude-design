import { create } from 'zustand'

// UI state for the shared layout drawers and modals. This replaces the Angular
// jQuery body-class toggling (`sidebar-enable`, `right-bar-enabled`) and
// `$('#modal').modal('show')` with plain React state shared across Header / Sidebar
// / Footer (which all triggered those toggles).
export type LayoutModal = 'bets' | 'password' | 'casino' | null

type LayoutUiState = {
  /** Left sport drawer (mobile) → body.sidebar-enable. */
  leftOpen: boolean
  /** Right user drawer → body.right-bar-enabled. */
  rightOpen: boolean
  /** Header slide-out menu (.side-menu.open). */
  sideMenuOpen: boolean
  modal: LayoutModal
  toggleLeft: () => void
  toggleRight: () => void
  toggleSideMenu: () => void
  closeSideMenu: () => void
  openModal: (m: Exclude<LayoutModal, null>) => void
  closeModal: () => void
}

export const useLayoutUi = create<LayoutUiState>((set) => ({
  leftOpen: false,
  rightOpen: false,
  sideMenuOpen: false,
  modal: null,
  toggleLeft: () => set((s) => ({ leftOpen: !s.leftOpen })),
  toggleRight: () => set((s) => ({ rightOpen: !s.rightOpen })),
  toggleSideMenu: () => set((s) => ({ sideMenuOpen: !s.sideMenuOpen })),
  closeSideMenu: () => set({ sideMenuOpen: false }),
  openModal: (m) => set({ modal: m }),
  closeModal: () => set({ modal: null }),
}))
