import { useEffect, useState } from 'react'
import { Modal, Table } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { get } from '../../api/http'
import { formatDateTime } from '../../utils/format'
import type { OpenBet } from '../../types'

// Open-bets modal — replaces the Angular `$('#viewOpenBetsModal').modal('show')`
// + getBets(). Loads bets when shown; a row click navigates to that event.
export function OpenBetsModal({ show, onHide }: { show: boolean; onHide: () => void }) {
  const [bets, setBets] = useState<OpenBet[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    if (!show) return
    let active = true
    get<{ data: OpenBet[] }>('bets?paginate=no')
      .then((res) => {
        if (active) setBets(res.data ?? [])
      })
      .catch(() => {
        if (active) setBets([])
      })
    return () => {
      active = false
    }
  }, [show])

  const goToEvent = (bet: OpenBet) => {
    onHide()
    navigate(`/event/${bet.MatchId}/${bet.MarketId}/${bet.sportsId}`)
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Open Bets</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-1 bg-graydark">
        <div className="table-responsive">
          <Table className="mb-0">
            <thead>
              <tr>
                <th>Match</th>
                <th>Market</th>
                <th>Odds</th>
                <th>Stakes</th>
                <th>Date</th>
                <th>P/L</th>
              </tr>
            </thead>
            <tbody>
              {bets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center">
                    No Data
                  </td>
                </tr>
              ) : (
                bets.map((bet, i) => (
                  <tr
                    key={i}
                    className={String(bet.isBack) === '0' ? 'back' : 'lay'}
                    role="button"
                    onClick={() => goToEvent(bet)}
                  >
                    <td>{bet.matchName}</td>
                    <td>{bet.marketName}</td>
                    <td>{Math.round(Number(bet.Odds ?? 0))}</td>
                    <td>{bet.Stack}</td>
                    <td>{bet.MstDate ? formatDateTime(bet.MstDate) : ''}</td>
                    <td className={Number(bet.P_L) > -1 ? 'text-success' : 'text-danger'}>{bet.P_L}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Modal.Body>
    </Modal>
  )
}
