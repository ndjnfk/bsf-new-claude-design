import { useEffect, useState } from 'react'
import { fetchHorse, parseRunners, type MatchRow } from '../services/dashboardApi'

// Horse / greyhound dashboard (sport 7 / 4339): fetch, derive country options, parse
// runners + start times, and sort by date — mirroring the Angular getHorseAndGrey().
export function useHorseRaces(sportId: string, enabled: boolean) {
  const [horse, setHorse] = useState<MatchRow[]>([])
  const [countryOptions, setCountryOptions] = useState<string[]>([])
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setHorse([])
      setCountryOptions([])
      return
    }
    let active = true
    setLoading(true)
    setError(false)
    fetchHorse(sportId)
      .then((res) => {
        if (!active) return
        const data = res.data ?? []
        const countries = Array.from(
          new Set(data.filter((el) => el.country_code).map((el) => el.country_code as string)),
        )
        setCountryOptions(countries)
        setSelectedCountry(countries[0] ?? null)
        const rows = data
          .map((el) => {
            el.runners = parseRunners(el.runner_json)
            if (el.start_times) {
              el.times = el.start_times.split(',').map((t) => {
                const m = t.split('|')
                return { marketId: m[0].trim(), time: m[1] + 'Z' }
              })
            }
            return el
          })
          .sort((a, b) => new Date(String(a.MstDate)).getTime() - new Date(String(b.MstDate)).getTime())
        setHorse(rows)
      })
      .catch(() => {
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [sportId, enabled])

  return { horse, countryOptions, selectedCountry, setSelectedCountry, loading, error }
}
