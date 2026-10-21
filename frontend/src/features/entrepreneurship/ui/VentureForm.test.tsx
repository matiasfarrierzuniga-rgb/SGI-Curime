import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useVentureMutations } from '../hooks/useVentures'
import { VentureForm } from './VentureForm'

vi.mock('../hooks/useVentures', () => ({ useVentureMutations: vi.fn() }))

const create = { isPending: false, mutateAsync: vi.fn() }
const update = { isPending: false, mutateAsync: vi.fn() }
const venture = { id: 7, name: 'Café Curime', description: 'Café local', offerDescription: 'Bebidas', businessPhone: '+506 8888-1234', businessEmail: 'hola@curime.cr', websiteUrl: 'https://curime.cr', socialUrl: 'https://facebook.com/curime', locationText: 'Curime, Nicoya', status: 'ACTIVE', publicationStatus: 'UNPUBLISHED', incorporatedAt: '2024-01-10T00:00:00.000Z', createdAt: '2024-01-10T00:00:00.000Z', updatedAt: '2024-01-10T00:00:00.000Z' }
const isoAtLocalMidnight = (value: string) => new Date(`${value}T00:00:00`).toISOString()

function renderForm(props: Partial<Parameters<typeof VentureForm>[0]> = {}) {
  const onClose = vi.fn()
  const onSuccess = vi.fn()
  const view = render(<VentureForm onClose={onClose} onSuccess={onSuccess} {...props} />)
  return { onClose, onSuccess, ...view }
}

function completeBasic() {
  fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Taller Curime' } })
  fireEvent.change(screen.getByLabelText(/Fecha de incorporación/), { target: { value: '2025-02-03' } })
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
}

function continueFromCommercialToReview() {
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
}

describe('VentureForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    create.isPending = false
    update.isPending = false
    create.mutateAsync.mockResolvedValue(undefined)
    update.mutateAsync.mockResolvedValue(undefined)
    vi.mocked(useVentureMutations).mockReturnValue({ create, update } as never)
  })

  it('validates required basic data, allows optional empty sections, and preserves values through navigation', () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByText('Ingrese nombre del emprendimiento.')).toBeInTheDocument()
    expect(screen.getByText('Indique fecha de incorporación.')).toBeInTheDocument()
    completeBasic()
    expect(screen.getByRole('heading', { name: 'Información comercial' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Correo comercial'), { target: { value: 'invalido' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByText('Ingrese correo electrónico válido.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Correo comercial'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(screen.getByLabelText(/Nombre/)).toHaveValue('Taller Curime')
    fireEvent.click(screen.getByRole('button', { name: /Información comercial/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByRole('heading', { name: 'Descripción y oferta' })).toBeInTheDocument()
  })

  it('navigates through every intermediate step without creating or updating', () => {
    renderForm()
    completeBasic()
    expect(create.mutateAsync).not.toHaveBeenCalled()
    expect(update.mutateAsync).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByRole('heading', { name: 'Descripción y oferta' })).toBeInTheDocument()
    expect(create.mutateAsync).not.toHaveBeenCalled()
    expect(update.mutateAsync).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByRole('heading', { name: 'Revise la información' })).toBeInTheDocument()
    expect(create.mutateAsync).not.toHaveBeenCalled()
    expect(update.mutateAsync).not.toHaveBeenCalled()
  })

  it('handles intermediate Enter as navigation without a mutation', () => {
    renderForm()
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Taller Curime' } })
    fireEvent.change(screen.getByLabelText(/Fecha de incorporación/), { target: { value: '2025-02-03' } })
    const form = screen.getByRole('dialog', { name: 'Registrar emprendimiento' }).querySelector('form')
    if (!form) throw new Error('Venture form was not rendered')
    fireEvent.submit(form)
    expect(screen.getByRole('heading', { name: 'Información comercial' })).toBeInTheDocument()
    expect(create.mutateAsync).not.toHaveBeenCalled()
    expect(update.mutateAsync).not.toHaveBeenCalled()
  })

  it('shows completed values in review and creates existing API payload shape', async () => {
    const { onClose, onSuccess } = renderForm()
    completeBasic()
    fireEvent.change(screen.getByLabelText('Correo comercial'), { target: { value: ' HOLA@CURIME.CR ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'Reparaciones locales' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByRole('heading', { name: 'Revise la información' })).toBeInTheDocument()
    expect(screen.getByText('Taller Curime')).toBeInTheDocument()
    expect(screen.getByText('Reparaciones locales')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Registrar emprendimiento' }))
    await waitFor(() => expect(create.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ name: 'Taller Curime', incorporatedAt: isoAtLocalMidnight('2025-02-03'), businessEmail: 'hola@curime.cr', description: 'Reparaciones locales' })))
    expect(create.mutateAsync).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith(false)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('updates with the venture id and retains API error state', async () => {
    update.mutateAsync.mockRejectedValueOnce(new Error('Servicio no disponible'))
    const { onClose, onSuccess } = renderForm({ venture })
    expect(screen.getByLabelText(/Nombre/)).toHaveValue('Café Curime')
    expect(screen.getByLabelText(/Fecha de incorporación/)).toHaveValue('2024-01-10')
    fireEvent.change(screen.getByLabelText('Ubicación'), { target: { value: 'Santa Cruz, Guanacaste' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    fireEvent.change(screen.getByLabelText('Teléfono comercial'), { target: { value: '+506 7777-0000' } })
    continueFromCommercialToReview()
    expect(update.mutateAsync).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(update.mutateAsync).toHaveBeenCalledWith({ id: 7, input: expect.objectContaining({ name: 'Café Curime', incorporatedAt: isoAtLocalMidnight('2024-01-10'), locationText: 'Santa Cruz, Guanacaste', businessPhone: '+506 7777-0000' }) }))
    const errorAlert = await screen.findByRole('alert')
    expect(errorAlert).toHaveTextContent('No fue posible guardar')
    expect(errorAlert).toHaveTextContent('No fue posible guardar emprendimiento.')
    expect(screen.getByRole('heading', { name: 'Revise la información' })).toBeInTheDocument()
    expect(screen.getByText('Santa Cruz, Guanacaste')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('prevents duplicate submissions while create mutation is pending', () => {
    const { rerender } = renderForm()
    completeBasic()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    create.isPending = true
    rerender(<VentureForm onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled()
    expect(create.mutateAsync).not.toHaveBeenCalled()
  })
})
