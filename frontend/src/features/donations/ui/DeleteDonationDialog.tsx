import { useState } from 'react'
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
      onClose()
    } catch (mutationError) {
      setError(getDonationErrorMessage(mutationError, 'No fue posible eliminar la donación.'))
    }
  }
  return <Modal title="Eliminar donación" onClose={onClose} busy={remove.isPending}>
    <div className="space-y-4"><p>Eliminar una donación solo debe utilizarse cuando el registro fue ingresado por error.</p><p>Esta acción eliminará también su movimiento financiero original y no puede deshacerse. Si la donación fue legítima y debe revertirse, utilice Cancelar.</p>{error ? <p role="alert" className="field-error">{error}</p> : null}<div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" disabled={remove.isPending} onClick={onClose}>Volver</Button><Button type="button" variant="destructive" disabled={remove.isPending} onClick={() => void confirm()}>{remove.isPending ? 'Eliminando…' : 'Eliminar donación'}</Button></div></div>
  </Modal>
}
