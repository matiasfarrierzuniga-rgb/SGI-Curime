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
    <div className="space-y-5"><div className="rounded-control border border-warning/30 bg-warning-bg p-3 text-body-small text-warning"><p className="font-semibold">Conservar trazabilidad financiera</p><p className="mt-1">Esta acción cancelará la donación y registrará un movimiento financiero de reversión. La operación permanecerá en el historial.</p></div><div className="grid gap-1"><label className="text-label font-semibold text-text-primary" htmlFor="donation-cancellation-reason">Motivo de cancelación</label><textarea ref={reasonRef} className="min-h-28 w-full rounded-control border border-border-default bg-control px-3 py-2 text-base text-text-primary shadow-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-control-disabled" id="donation-cancellation-reason" rows={4} maxLength={500} value={reason} disabled={cancel.isPending} onChange={event => { setReason(event.target.value); if (error) setError('') }} aria-invalid={Boolean(error)} aria-describedby={error ? 'donation-cancellation-error' : undefined} /></div>{error ? <p id="donation-cancellation-error" role="alert" className="field-error">{error}</p> : null}<div className="flex flex-col-reverse gap-2 border-t border-border-subtle pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={cancel.isPending} onClick={onClose}>Volver</Button><Button type="button" variant="destructive" loading={cancel.isPending} onClick={() => void submit()}>Cancelar donación</Button></div></div>
  </Modal>
}
