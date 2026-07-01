import { get } from '../api/http'
import type { SportMenuItem } from '../types'

type RawSport = { id: number; name: string; [key: string]: unknown }

// Mirrors ApiService.getSports(): GET 'sports' → { data: [...] }.
// skipAuthRedirect: an optional list — a 401/404 shouldn't force a logout.
export async function fetchSports(): Promise<RawSport[]> {
  const res = await get<{ data: RawSport[] }>('sports', { skipAuthRedirect: true })
  return res.data ?? []
}

// Port of the Angular sidebar getSport() mapping: filter casino placeholders and
// map each sport to its icon + target route. (Asset paths point at the migrated
// /assets/image set; the original assets/img/login icons were not migrated.)
export function toMenu(sports: RawSport[]): SportMenuItem[] {
  return sports.filter((v) => v.id <= 1236 && v.id !== 1234).map(mapSport)
}

function mapSport(v: RawSport): SportMenuItem {
  if (v.id < 78) {
    const image = `/assets/image/${v.name}`.toLowerCase() + '.png'
    return { id: v.id, name: v.name, image, url: '/home', qr: { sport_id: v.id } }
  }
  if (v.id === 1233) {
    return { id: v.id, name: v.name, image: '/assets/image/cricket.png', url: '/pokerUrl' }
  }
  if (v.id === 1235) {
    return { id: v.id, name: 'Casino', image: '/assets/image/royal-casino.webp', url: '/dreamCasino' }
  }
  if (v.id === 1236) {
    return { id: v.id, name: v.name, image: '/assets/image/royal-casino.webp', url: '/gamehubCasino' }
  }
  return { id: v.id, name: v.name, image: '/assets/image/royal-casino.webp', url: '/home' }
}
