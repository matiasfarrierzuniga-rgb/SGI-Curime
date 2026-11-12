import type { ComponentProps } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CreatePersonDialog } from './CreatePersonDialog'

function renderDialog(overrides: Partial<ComponentProps<typeof CreatePersonDialog>> = {}) {
  const props = {
    busy: false,
    error: null,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides,
  }
  render(<CreatePersonDialog {...props} />)
  return { ...props, dialog: screen.getByRole('dialog', { name: 'Registrar Persona' }) }
}

describe('CreatePersonDialog', () => {
  it('submits a normalized structured Person without optional empty fields', async () => {
    const { onConfirm, dialog } = renderDialog()

    fireEvent.change(within(dialog).getByLabelText('Tipo de identificación'), { target: { value: 'DIMEX' } })
    fireEvent.change(within(dialog).getByLabelText('Identificación'), { target: { value: '123456789012' } })
    fireEvent.change(within(dialog).getByLabelText('Nombre'), { target: { value: ' Ana ' } })
    fireEvent.change(within(dialog).getByLabelText('Primer apellido'), { target: { value: ' Pérez ' } })
    fireEvent.change(within(dialog).getByLabelText('Motivo'), { target: { value: ' Alta administrativa para aprovisionamiento RBAC. ' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Registrar Persona' }))

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith({
      identificationType: 'DIMEX',
      identification: '123456789012',
      firstName: 'Ana',
      firstSurname: 'Pérez',
      reason: 'Alta administrativa para aprovisionamiento RBAC.',
    }), { timeout: 10000 })
  }, 15000)

  it('shows inline validation errors and does not submit incomplete identities', async () => {
    const { onConfirm, dialog } = renderDialog()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Registrar Persona' }))

    expect(await within(dialog).findByText('Cédula nacional: debe contener exactamente 9 dígitos y no iniciar en 0.')).toBeInTheDocument()
    expect(within(dialog).getAllByText('Este campo es obligatorio.')).toHaveLength(2)
    expect(within(dialog).getByText('Explique brevemente el motivo administrativo.')).toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('shows the backend conflict message for duplicate or already linked identities', async () => {
    renderDialog({
      error: {
        isAxiosError: true,
        response: {
          status: 409,
          data: { message: 'La Persona ya está vinculada a una cuenta SGI.' },
        },
      },
    })

    expect(screen.getByRole('alert')).toHaveTextContent('La Persona ya está vinculada a una cuenta SGI.')
  })

  it('disables close and submit while the mutation is pending', () => {
    const onClose = vi.fn()
    const { dialog } = renderDialog({ busy: true, onClose })

    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    expect(within(dialog).getByRole('button', { name: /Registrar Persona/ })).toBeDisabled()
    expect(onClose).not.toHaveBeenCalled()
  })
})
