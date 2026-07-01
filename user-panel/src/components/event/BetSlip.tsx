export type BetSlipView = {
  runnerName: string
  side: 'back' | 'lay'
  price: number
  stake: number
  profit: number
  isFancy: boolean
}

// Controlled bet slip: odds, stake (with quick-stake buttons + inc/dec), live profit,
// the odds-change countdown, and a place button that is disabled while a bet is in
// flight (duplicate-/double-submit prevention).
export function BetSlip({
  slip,
  stakes,
  countdown,
  isLoading,
  runChanged,
  onStake,
  onQuickStake,
  onInc,
  onDec,
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
  onInc: () => void
  onDec: () => void
  onPlace: () => void
  onClear: () => void
}) {
  const sideClass = slip.side === 'lay' ? 'khai_box_color' : 'lagai_box_color'
  return (
    <div className={`betting-section bet-table desktop_betslip blue-bet ${slip.side}`}>
      <div className="d-flex justify-content-between align-items-center px-2 py-1">
        <span className="eventname fw-bold">{slip.runnerName}</span>
        <span className="countdownHolder fs-12">{countdown}s</span>
        <button type="button" className="bet-close btn-close" aria-label="Close" onClick={onClear} />
      </div>

      {runChanged ? <div className="text-danger fs-12 px-2">Run Changed</div> : null}

      <div className="card-body d-flex align-items-center gap-2 px-2 py-2">
        <span className={`bl-btn ${sideClass}`}>{slip.price}</span>
        <button type="button" className="btn btn-sm btn-secondary" onClick={onDec} aria-label="decrease">
          −
        </button>
        <input
          type="number"
          className="form-control text-center"
          style={{ maxWidth: 110 }}
          value={slip.stake || ''}
          onChange={(e) => onStake(Number(e.target.value))}
          placeholder="0"
        />
        <button type="button" className="btn btn-sm btn-secondary" onClick={onInc} aria-label="increase">
          +
        </button>
        <span className="ms-auto fs-12">
          Profit: <b>{slip.profit}</b>
        </span>
      </div>

      <div className="btn-group flex-wrap px-2 pb-2">
        {stakes.map((s, i) => (
          <button type="button" key={`${s}-${i}`} className="btn btn-sm btn-outline-secondary me-1 mb-1" onClick={() => onQuickStake(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="d-flex gap-2 px-2 pb-2">
        <button type="button" className="btn btn-secondary flex-grow-1" onClick={onClear} disabled={isLoading}>
          Clear
        </button>
        <button type="button" className="btn btn-success flex-grow-1" onClick={onPlace} disabled={isLoading || slip.stake <= 0}>
          {isLoading ? 'Placing…' : 'Place Bet'}
        </button>
      </div>
    </div>
  )
}
