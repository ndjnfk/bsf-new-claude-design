import { useLayoutUi } from '../../store/layoutUi'
import { OpenBetsModal } from './OpenBetsModal'
import { ChangePasswordModal } from './ChangePasswordModal'
import { CasinoTransferModal } from './CasinoTransferModal'

// Renders the shared layout modals, each shown based on the single `modal` field in
// the layout store (state-driven, replacing jQuery `.modal('show')`).
export function LayoutModals() {
  const modal = useLayoutUi((s) => s.modal)
  const close = useLayoutUi((s) => s.closeModal)
  return (
    <>
      <OpenBetsModal show={modal === 'bets'} onHide={close} />
      <ChangePasswordModal show={modal === 'password'} onHide={close} />
      <CasinoTransferModal show={modal === 'casino'} onHide={close} />
    </>
  )
}
