import './BetSlip.scss'

export type BetSlipView = {
  marketName: string
  runnerName: string // TEAM (runner / fancy head)
  side: 'back' | 'lay'
  bat: string // LAGAI / KHAI (market) or YES / NO (fancy)
  price: number
  stake: number
  profit: number
  isFancy: boolean
}

// Bet slip — a faithful port of the reference pill layout:
//   Market : … | RATE : … | TEAM : … | BAT : LAGAI/KHAI | AMOUNT [stake] [Done] (countdown)
//   [100][200][300][500][1000] [⚙] [Cancel]
// Every field reflects the exact price the user clicked (market, rate, team, side).
export function BetSlip({
  slip,
  stakes,
  countdown,
  isLoading,
  runChanged,
  onStake,
  onQuickStake,
  onPlace,
  onClear,
}: {
  slip: BetSlipView
  stakes: number[]
  countdown: number
  isLoading: boolean
  runChanged: boolean
  onStake: (v: number) => void
  onQuickStake: (v: number) => void
  onPlace: () => void
  onClear: () => void
}) {
  const batClass = slip.side === 'lay' ? 'bat-khai' : 'bat-lagai'
  return (
    <div className={`betslip-wrap ${slip.side}`}>
      <div className="betslip-bar">
        <div className="bs-field">
          <span className="bs-label">Market :</span>
          <span className="bs-value">{slip.marketName}</span>
        </div>
        <div className="bs-field">
          <span className="bs-label">RATE :</span>
          <span className="bs-value">{slip.price}</span>
        </div>
        <div className="bs-field">
          <span className="bs-label">TEAM :</span>
          <span className="bs-value">{slip.runnerName}</span>
        </div>
        <div className="bs-field">
          <span className="bs-label">BAT :</span>
          <span className={`bs-value ${batClass}`}>{slip.bat}</span>
        </div>

        <span className="bs-amount-label">AMOUNT</span>
        <div className="bs-amount">
          <input
            type="number"
            className="bs-stake"
            placeholder="Stake"
            value={slip.stake || ''}
            onChange={(e) => onStake(Number(e.target.value))}
          />
          <button type="button" className="bs-done" onClick={onPlace} disabled={isLoading || slip.stake <= 0}>
            {isLoading ? '…' : 'Done'}
          </button>
        </div>
        <span className="bs-count" aria-label="odds countdown">
          {countdown}
        </span>
      </div>

      <div className="betslip-bar betslip-bar-2">
        {stakes.map((s, i) => (
          <button type="button" key={`${s}-${i}`} className="bs-chip" onClick={() => onQuickStake(s)}>
            {s}
          </button>
        ))}
        <button type="button" className="bs-gear" aria-label="stake settings">
          ⚙
        </button>
        <button type="button" className="bs-cancel" onClick={onClear}>
          Cancel
        </button>
      </div>

      {runChanged ? <div className="text-danger fs-12 px-2 pt-1">Run Changed</div> : null}
    </div>
  )
}
