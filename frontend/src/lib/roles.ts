// Mirrors backend pkg/domain/roles.go. Maps usetype → display name and the
// single role each tier may create.
export const USETYPE = {
  SUPER_DUPER_ADMIN: 0,
  COMPANY: 11,
  ADMIN: 10,
  SUB_ADMIN: 9,
  SUPER_MASTER: 8,
  MASTER: 1,
  DEALER: 2,
  PLAYER: 3,
  HELPER: 55,
} as const

const NAMES: Record<number, string> = {
  0: 'Super Duper Admin',
  11: 'Company',
  10: 'Admin',
  9: 'Sub Admin',
  8: 'Super Master',
  1: 'Master',
  2: 'Dealer',
  3: 'End User (Player)',
  55: 'Helper',
}

export const roleName = (usetype: number): string => NAMES[usetype] ?? 'Unknown'

// Reference-style labels for the create selector / role sections.
export const ROLE_LABEL: Record<number, string> = {
  0: 'Super Duper Admin', 11: 'Company', 10: 'Admin', 9: 'Sub Admin',
  8: 'Super Stockist', 1: 'Stockist', 2: 'Dealer', 3: 'User', 55: 'Helper',
}

// Hierarchy rank top→bottom (mirrors backend domain.rank).
const RANK: Record<number, number> = { 0: 0, 11: 1, 10: 2, 9: 3, 8: 4, 1: 5, 2: 6, 3: 7 }
const DOWNLINE = [10, 9, 8, 1, 2, 3] // Admin … User

// creatableRoles: SDA → Company only; Company…Dealer → any tier strictly below
// them; User → none. Mirrors backend Usetype.CreatableRoles.
export const creatableRoles = (usetype: number): number[] => {
  if (usetype === 0) return [11]
  const r = RANK[usetype]
  if (r === undefined || usetype === 3) return []
  return DOWNLINE.filter((t) => RANK[t] > r)
}

// childRoleName — the immediate next tier (default / labels).
export const childRoleName = (usetype: number): string | null => {
  const child = creatableRoles(usetype)[0]
  return child === undefined ? null : NAMES[child]
}
