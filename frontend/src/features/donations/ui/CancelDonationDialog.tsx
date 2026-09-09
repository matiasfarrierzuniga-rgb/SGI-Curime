import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/button'
import { useCancelDonation } from '../hooks/donations.queries'
import { getDonationErrorMessage } from './donationPresentation'

export function CancelDonationDialog({ id, onClose }: { id: number; onClose: () => void }) {
  const cancel = useCancelDonation()
  const reasonRef = useRef<HTMLTextAreaElement>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  async function submit() {
    const cancellationReason = reason.trim()
    if (!cancellationReason) {
      setError('El motivo de cancelación es requerido.')
      reasonRef.current?.focus()
      return
    }
    try {
      await cancel.mutateAsync({ id, input: { cancellationReason } })
      toast.success('Donación cancelada correctamente.')
      onClose()
    } catch (mutationError) {
      setError(getDonationErrorMessage(mutationError, 'No fue posible cancelar la donación.'))
    }
  }
  return <Modal title="Cancelar donación" onClose={onClose} busy={cancel.isPending} initialFocusRef={reasonRef}>
    <div className="space-y-4"><p>Esta acción cancelará la donación y registrará un movimiento financiero de reversión. La operación permanecerá en el historial.</p><div className="grid gap-1"><label htmlFor="donation-cancellation-reason">Motivo de cancelación</label><textarea ref={reasonRef} id="donation-cancellation-reason" rows={4} maxLength={500} value={reason} disabled={cancel.isPending} onChange={event => setReason(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? 'donation-cancellation-error' : undefined} /></div>{error ? <p id="donation-cancellation-error" role="alert" className="field-error">{error}</p> : null}<div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" disabled={cancel.isPending} onClick={onClose}>Volver</Button><Button type="button" variant="destructive" disabled={cancel.isPending} onClick={() => void submit()}>{cancel.isPending ? 'Cancelando…' : 'Cancelar donación'}</Button></div></div>
  </Modal>
}
