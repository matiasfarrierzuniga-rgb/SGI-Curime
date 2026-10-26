import { describe, expect, it, vi } from 'vitest'

const fire = vi.hoisted(() => vi.fn())
vi.mock('sweetalert2', () => ({ default: { fire } }))

import { showResultDialog } from './resultDialog'

describe('showResultDialog', () => {
  it('uses institutional classes and keyboard-focused confirmation', () => {
    showResultDialog({ icon: 'info', title: 'Solicitud recibida', text: 'Mensaje neutral', confirmButtonText: 'Entendido' })

    expect(fire).toHaveBeenCalledWith(expect.objectContaining({
      icon: 'info',
      focusConfirm: true,
      returnFocus: true,
      customClass: expect.objectContaining({ popup: 'sgi-result-dialog', confirmButton: 'sgi-result-dialog__confirm' }),
    }))
  })
})
