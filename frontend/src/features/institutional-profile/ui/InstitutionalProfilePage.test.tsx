import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useInstitutionalProfile, useUpdateInstitutionalProfile } from '../hooks/institutionalProfile.queries'
import { InstitutionalProfilePage } from './InstitutionalProfilePage'

vi.mock('../hooks/institutionalProfile.queries', () => ({ useInstitutionalProfile: vi.fn(), useUpdateInstitutionalProfile: vi.fn() }))

const emptyProfile = { id: 1 as const, legalName: null, legalIdentification: null, dinadecoRegistrationCode: null, dinadecoRegion: null, organizationType: null, province: null, canton: null, district: null, locality: null, correspondenceAddress: null, phone: null, telefax: null, email: null, createdAt: '2026-09-20T00:00:00.000Z', updatedAt: '2026-09-20T00:00:00.000Z' }
const mutateAsync = vi.fn()

describe('InstitutionalProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useInstitutionalProfile).mockReturnValue({ data: emptyProfile, isPending: false, isError: false, error: null, refetch: vi.fn() } as never)
    vi.mocked(useUpdateInstitutionalProfile).mockReturnValue({ mutateAsync, isPending: false } as never)
  })

  it('renders the empty profile without public-site defaults', () => {
    render(<InstitutionalProfilePage />)
    expect(screen.getByLabelText(/Nombre legal/)).toHaveValue('')
    expect(screen.getByLabelText(/Provincia/)).toHaveValue('')
    expect(screen.getByLabelText(/Correo institucional/)).toHaveValue('')
    expect(screen.getByText(/todavía no ha sido validado o cargado/i)).toBeVisible()
  })

  it('edits, normalizes, clears nullable values, saves, and shows success', async () => {
    mutateAsync.mockResolvedValue({ ...emptyProfile, legalName: 'Asociación de Desarrollo Integral de Prueba', email: 'contacto@prueba.test' })
    render(<InstitutionalProfilePage />)
    fireEvent.change(screen.getByLabelText(/Nombre legal/), { target: { value: '  Asociación de Desarrollo Integral de Prueba  ' } })
    fireEvent.change(screen.getByLabelText(/Correo institucional/), { target: { value: ' CONTACTO@PRUEBA.TEST ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar perfil' }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ legalName: 'Asociación de Desarrollo Integral de Prueba', email: 'contacto@prueba.test', canton: null })))
    expect(await screen.findByRole('status')).toHaveTextContent('guardado correctamente')
  })

  it('shows inline email validation and does not submit', async () => {
    render(<InstitutionalProfilePage />)
    fireEvent.change(screen.getByLabelText(/Correo institucional/), { target: { value: 'correo inválido' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar perfil' }))
    expect(await screen.findByRole('alert')).toBeVisible()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('preserves form values and shows an API error', async () => {
    mutateAsync.mockRejectedValue(new Error('Fallo de prueba'))
    render(<InstitutionalProfilePage />)
    fireEvent.change(screen.getByLabelText(/Nombre legal/), { target: { value: 'Asociación de Prueba' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar perfil' }))
    expect(await screen.findByText('No fue posible guardar el perfil institucional.')).toBeVisible()
    expect(screen.getByLabelText(/Nombre legal/)).toHaveValue('Asociación de Prueba')
  })

  it('disables the form and exposes saving state', () => {
    vi.mocked(useUpdateInstitutionalProfile).mockReturnValue({ mutateAsync, isPending: true } as never)
    render(<InstitutionalProfilePage />)
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled()
    expect(screen.getByLabelText(/Nombre legal/)).toBeDisabled()
  })

  it('renders loading and API load errors', () => {
    vi.mocked(useInstitutionalProfile).mockReturnValue({ data: undefined, isPending: true, isError: false } as never)
    const { rerender } = render(<InstitutionalProfilePage />)
    expect(screen.getByText('Cargando perfil institucional...')).toBeVisible()
    vi.mocked(useInstitutionalProfile).mockReturnValue({ data: undefined, isPending: false, isError: true, error: new Error('No disponible'), refetch: vi.fn() } as never)
    rerender(<InstitutionalProfilePage />)
    expect(screen.getByText('Ocurrió un error. Intenta nuevamente.')).toBeVisible()
  })
})
