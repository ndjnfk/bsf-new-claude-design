import { useState } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import { post } from '../../api/http'

// Casino balance transfer modal — replaces the Angular jQuery casinoBalance modal
// + saveCasinoTransfer(). POSTs to casino_balance/{deposit|withdraw}.
export function CasinoTransferModal({
  show,
  onHide,
  type = 'deposit',
}: {
  show: boolean
  onHide: () => void
  type?: 'deposit' | 'withdraw'
}) {
  const [amount, setAmount] = useState(0)

  const save = async () => {
    try {
      await post(`casino_balance/${type}`, { amount })
      setAmount(0)
      onHide()
    } catch {
      /* error toast handled by the interceptor */
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Casino Balance</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group>
          <Form.Control type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button variant="primary" onClick={() => void save()}>
          Save changes
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
