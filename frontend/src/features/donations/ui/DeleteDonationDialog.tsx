import { useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/button'
import { useDeleteDonation } from '../hooks/donations.queries'
import { getDonationErrorMessage } from './donationPresentation'

export function DeleteDonationDialog({ id, onClose }: { id: number; onClose: () => void }) {
  const remove = useDeleteDonation()
  const [error, setError] = useState('')
  async function confirm() {
    try {
      await remove.mutateAsync(id)
      toast.success('Donación eliminada correctamente.')
      onClose()
    } catch (mutationError) {
      setError(getDonationErrorMessage(mutationError, 'No fue posible eliminar la donación.'))
    }
  }
  return <Modal title="Eliminar donación" onClose={onClose} busy={remove.isPending}>
    <div className="space-y-5">
      <div className="rounded-control border border-danger/25 bg-danger-bg p-3 text-body-small text-danger"><p className="font-semibold">Eliminación permanente</p><p className="mt-1">Eliminar una donación solo debe utilizarse cuando el registro fue ingresado por error.</p></div>
      <p className="text-body-small text-text-secondary">Esta acción eliminará también su movimiento financiero original y no puede deshacerse. Si la donación fue legítima y debe revertirse, utilice Cancelar.</p>
      {error ? <p role="alert" className="field-error">{error}</p> : null}
      <div className="flex flex-col-reverse gap-2 border-t border-border-subtle pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={remove.isPending} onClick={onClose}>Volver</Button><Button type="button" variant="destructive" loading={remove.isPending} onClick={() => void confirm()}>Eliminar donación</Button></div>
    </div>
  </Modal>
}
