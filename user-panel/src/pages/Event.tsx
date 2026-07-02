import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuth } from '../store/auth'
import { useEventData } from '../hooks/useEventData'
import { MarketTable } from '../components/event/MarketTable'
import { FancyTable } from '../components/event/FancyTable'
import { BetSlip, type BetSlipView } from '../components/event/BetSlip'
import { Loader } from '../components/common/Loader'
import { EmptyMarkets, EventLoadError, InvalidEventParams } from '../components/event/EventStates'
import { bookmakerOdds, calcProfit, getLimits, isBookmaker } from '../utils/eventCalc'
import { getDeviceInfo } from '../utils/device'
import { formatDayDate } from '../utils/format'
import {
  placeFancyBet,
  placeLineBet,
  placeMarketBet,
  type Fancy,
  type Market,
  type Runner,
} from '../services/bettingApi'

type Slip = {
  isFancy: boolean
  isIndian: boolean
  side: 'back' | 'lay'
  price: number
  stake: number
  profit: number
  volume: number
  runnerName: string
  market?: Market
  runner?: Runner
  fancy?: Fancy
}

const COUNTDOWN_START = 8

// Route param validation. eventId / sportId are numeric; marketId is a Betfair
// market code (e.g. "1.259435885" or "MATCH_ODDS:1").
const NUMERIC = /^\d+$/
const MARKET_CODE = /^[\w.:-]+$/

// Event is the route entry: it validates the params and only mounts the data layer
// for a valid event, so an invalid link never fires a request.
export default function Event() {
  const { event_id = '', market_id = '', sport_id = '' } = useParams()
  const valid =
    NUMERIC.test(event_id) && MARKET_CODE.test(market_id) && market_id !== '' && NUMERIC.test(sport_id)

  if (!valid) return <InvalidEventParams />
  return <EventContent eventId={event_id} marketId={market_id} sportId={sport_id} />
}

// Live betting event page. event/market/sport ids drive the data load + socket
// rooms (useEventData). Selecting a runner/fancy opens the bet slip (8s odds
// countdown); placing posts the EXACT Adonis payload and is guarded against
// duplicate submissions.
function EventContent({ eventId, marketId, sportId }: { eventId: string; marketId: string; sportId: string }) {
  useDocumentTitle('Event')

  const user = useAuth((s) => s.user)
  const domain = useAuth((s) => s.domain)

  const [slip, setSlip] = useState<Slip | null>(null)
  const [countdown, setCountdown] = useState(COUNTDOWN_START)
  const [isLoading, setIsLoading] = useState(false)
  const [runChanged, setRunChanged] = useState(false)

  const activeFancyRef = useRef<Fancy | null>(null)
  const sideRef = useRef<'back' | 'lay' | null>(null)
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const placingRef = useRef(false)

  const clearCountdown = useCallback(() => {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current)
      countdownTimer.current = null
    }
  }, [])

  const clearBet = useCallback(() => {
    clearCountdown()
    setSlip(null)
    setRunChanged(false)
    activeFancyRef.current = null
    sideRef.current = null
  }, [clearCountdown])

  const startCountdown = useCallback(() => {
    clearCountdown()
    setCountdown(COUNTDOWN_START)
    countdownTimer.current = setInterval(() => {
      setCountdown((c) => {
        if (c > 1) return c - 1
        clearBet()
        return COUNTDOWN_START
      })
    }, 1000)
  }, [clearCountdown, clearBet])

  const { match, markets, fancies, fancyLimits, loading, error, reload } = useEventData(
    eventId,
    marketId,
    sportId,
    user?.mstrid,
    { activeFancyRef, sideRef, onRunChanged: () => setRunChanged(true), onClearBet: clearBet },
  )

  // Clean up the countdown on unmount.
  useEffect(() => () => clearCountdown(), [clearCountdown])

  const recalcProfit = useCallback(
    (s: Slip, stake: number): number =>
      calcProfit({
        isFancy: s.isFancy,
        isIndianFancy: s.isIndian,
        isBack: s.side === 'back' ? 0 : 1,
        stake,
        odds: s.price,
        volume: s.volume,
      }),
    [],
  )

  const openMarketSlip = useCallback(
    (m: Market, runner: Runner, side: 'back' | 'lay') => {
      const raw = Number(side === 'back' ? runner.back0?.price : runner.lay0?.price)
      const price = isBookmaker(String(m.marketid)) ? bookmakerOdds(raw) : raw
      activeFancyRef.current = null
      sideRef.current = side
      setRunChanged(false)
      setSlip({ isFancy: false, isIndian: false, side, price, stake: 0, profit: 0, volume: 0, runnerName: runner.name, market: m, runner })
      startCountdown()
    },
    [startCountdown],
  )

  const openFancySlip = useCallback(
    (fancy: Fancy, side: 'back' | 'lay') => {
      const price = Number(side === 'back' ? fancy.SessInptYes : fancy.SessInptNo)
      const volume = Number(side === 'back' ? fancy.YesValume : fancy.NoValume)
      activeFancyRef.current = fancy
      sideRef.current = side
      setRunChanged(false)
      setSlip({
        isFancy: true,
        isIndian: !!fancy.is_indian_fancy,
        side,
        price,
        stake: 0,
        profit: 0,
        volume,
        runnerName: fancy.HeadName,
        fancy,
      })
      startCountdown()
    },
    [startCountdown],
  )

  const setStake = useCallback(
    (stake: number) => setSlip((s) => (s ? { ...s, stake, profit: recalcProfit(s, stake) } : s)),
    [recalcProfit],
  )

  const placeBet = useCallback(async () => {
    if (placingRef.current) return // duplicate-submit guard (race condition)
    const s = slip
    if (!s || s.stake <= 0) return

    // Min/max validation (skipped when limits are not numeric).
    let min = NaN
    let max = NaN
    if (s.isFancy && s.fancy) {
      const lim = getLimits(s.fancy, null, fancyLimits)
      min = Number(lim.min)
      max = Number(lim.max)
    } else if (s.market) {
      min = Number(s.market.min_stack)
      max = Number(s.market.max_stack)
    }
    if (!Number.isNaN(min) && min > 0 && s.stake < min) {
      toast.error(`Minimum stake is ${min}`)
      return
    }
    if (!Number.isNaN(max) && max > 0 && s.stake > max) {
      toast.error(`Maximum stake is ${max}`)
      return
    }

    placingRef.current = true
    setIsLoading(true)
    clearCountdown()
    const isBack: 0 | 1 = s.side === 'back' ? 0 : 1
    try {
      if (!s.isFancy && s.market && s.runner) {
        await placeMarketBet({
          matchId: match.MstCode ?? eventId,
          matchName: match.matchName,
          selectionId: String(s.runner.id),
          runnerName: s.runner.name,
          marketId: s.market.marketid,
          stake: s.stake,
          price: s.price,
          isBack,
          deviceInfo: '1',
          inPlay: true,
          profit: s.profit,
          isCashout: false,
          sportId: sportId,
          domain: domain ?? undefined,
        })
      } else if (s.fancy) {
        const payload = {
          price: s.price,
          side: isBack,
          stake: s.stake,
          typeId: s.fancy.TypeID,
          matchId: s.fancy.MatchID,
          marketId: s.fancy.market_id,
          fancyId: s.fancy.ID,
          selectionId: s.fancy.ind_fancy_selection_id,
          fHeadName: s.fancy.HeadName,
          sessInpYes: s.fancy.SessInptYes,
          sessInpNo: s.fancy.SessInptNo,
          sportId: s.fancy.SprtId,
          pointDiff: s.fancy.pointDiff,
          deviceDesc: getDeviceInfo().browser_info,
          sessSizeYes: s.fancy.YesValume,
          sessSizeNo: s.fancy.NoValume,
        }
        if (s.isIndian) await placeFancyBet(payload)
        else await placeLineBet(payload)
      }
      clearBet()
    } catch {
      /* error toast handled by the interceptor */
    } finally {
      setIsLoading(false)
      placingRef.current = false
    }
  }, [slip, fancyLimits, match, eventId, sportId, domain, clearCountdown, clearBet])

  const quickStakes: number[] = Array.isArray(user?.stakes) ? user.stakes.map(Number) : []
  const view: BetSlipView | null = slip
    ? {
        // Market name = the clicked market (fancy → "Fancy"); team = clicked runner/
        // fancy head; rate = clicked price; BAT reflects the clicked side.
        marketName: slip.isFancy ? 'Fancy' : slip.market?.market_name ?? '',
        runnerName: slip.runnerName,
        side: slip.side,
        bat: slip.isFancy
          ? slip.side === 'back'
            ? 'YES'
            : 'NO'
          : slip.side === 'back'
            ? 'LAGAI'
            : 'KHAI',
        price: slip.price,
        stake: slip.stake,
        profit: slip.profit,
        isFancy: slip.isFancy,
      }
    : null

  if (loading) return <Loader label="Loading event…" />
  if (error)
    return (
      <div id="wrapper">
        <div className="content-page m-0">
          <EventLoadError onRetry={reload} />
        </div>
      </div>
    )

  const startTime = match.MstDate ? formatDayDate(String(match.MstDate)) : ''
  const inPlay = Boolean(match.inPlay) || markets.some((m) => m.inPlay)
  const noMarkets = markets.length === 0 && fancies.length === 0

  return (
    <div id="wrapper">
      <div className="content-page m-0">
        <div className="container py-2">
          <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
            <h5 className="match-heading mb-0">{match.matchName}</h5>
            {startTime ? <span className="fs-12 text-muted">{startTime}</span> : null}
            {inPlay ? <span className="badge bg-danger blinking-inplay">In-Play</span> : null}
          </div>

          {noMarkets ? (
            <EmptyMarkets />
          ) : (
            <>
              {markets.map((m) => (
                <MarketTable key={String(m.marketid)} market={m} onSelect={openMarketSlip} />
              ))}

              <FancyTable fancies={fancies} fancyLimits={fancyLimits} onSelect={openFancySlip} />
            </>
          )}

          {view ? (
            <BetSlip
              slip={view}
              stakes={quickStakes}
              countdown={countdown}
              isLoading={isLoading}
              runChanged={runChanged}
              onStake={setStake}
              onQuickStake={setStake}
              onPlace={() => void placeBet()}
              onClear={clearBet}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
