import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useInstitutionalProfile, useUpdateInstitutionalProfile } from '../hooks/institutionalProfile.queries'
import { InstitutionalProfilePage } from './InstitutionalProfilePage'

vi.mock('../hooks/institutionalProfile.queries', () => ({ useInstitutionalProfile: vi.fn(), useUpdateInstitutionalProfile: vi.fn() }))

const emptyProfile = { id: 1 as const, legalName: null, legalIdentification: null, dinadecoRegistrationCode: null, dinadecoRegion: null, organizationType: null, province: null, canton: null, district: null, locality: null, correspondenceAddress: null, phone: null, telefax: null, email: null, createdAt: '2026-09-20T00:00:00.000Z', updatedAt: '2026-09-20T00:00:00.000Z' }
const mutateAsync = vi.fn()
let permissionCodes = ['adm.institutional-profile.read', 'adm.institutional-profile.update']

function goToLastStep() {
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
}

vi.mock('@/features/auth', () => ({ useAuth: () => ({ user: { permissionCodes } }) }))

describe('InstitutionalProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    permissionCodes = ['adm.institutional-profile.read', 'adm.institutional-profile.update']
    vi.mocked(useInstitutionalProfile).mockReturnValue({ data: emptyProfile, isPending: false, isError: false, error: null, refetch: vi.fn() } as never)
    vi.mocked(useUpdateInstitutionalProfile).mockReturnValue({ mutateAsync, isPending: false } as never)
  })

  it('renders the empty profile without public-site defaults and exposes edit only with permission', () => {
    render(<InstitutionalProfilePage />)
    expect(screen.getAllByText('Sin validar o cargar')).not.toHaveLength(0)
    expect(screen.getByText(/todavía no ha sido validado o cargado/i)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Editar perfil' })).toBeVisible()
  })

  it('starts edit mode at first step and provides accessible step progress', () => {
    render(<InstitutionalProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))
    expect(screen.getByRole('navigation', { name: 'Progreso del formulario' })).toBeVisible()
    expect(screen.getByRole('button', { name: /Identificación legal/ })).toHaveAttribute('aria-current', 'step')
    expect(screen.getByText('Datos que identifican formalmente a la Asociación ante entidades y registros.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeVisible()
  })

  it('moves next and back while preserving entered values', () => {
    render(<InstitutionalProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))
    fireEvent.change(screen.getByLabelText(/Nombre legal/), { target: { value: 'Asociación de Prueba' } })
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(screen.getByText('Información de inscripción y referencia administrativa vigente.')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Atrás' }))
    expect(screen.getByLabelText(/Nombre legal/)).toHaveValue('Asociación de Prueba')
  })

  it('edits, normalizes, clears nullable values, saves once from last step, and shows success', async () => {
    mutateAsync.mockResolvedValue({ ...emptyProfile, legalName: 'Asociación de Desarrollo Integral de Prueba', email: 'contacto@prueba.test' })
    render(<InstitutionalProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))
    fireEvent.change(screen.getByLabelText(/Nombre legal/), { target: { value: '  Asociación de Desarrollo Integral de Prueba  ' } })
    goToLastStep()
    fireEvent.change(screen.getByLabelText(/Correo institucional/), { target: { value: ' CONTACTO@PRUEBA.TEST ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ legalName: 'Asociación de Desarrollo Integral de Prueba', email: 'contacto@prueba.test', canton: null })))
    expect(mutateAsync).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('status')).toHaveTextContent('guardado correctamente')
  })

  it('shows inline email validation and does not submit', async () => {
    render(<InstitutionalProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))
    goToLastStep()
    fireEvent.change(screen.getByLabelText(/Correo institucional/), { target: { value: 'correo inválido' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByRole('alert')).toBeVisible()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('preserves form values and shows an API error', async () => {
    mutateAsync.mockRejectedValue(new Error('Fallo de prueba'))
    render(<InstitutionalProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))
    fireEvent.change(screen.getByLabelText(/Nombre legal/), { target: { value: 'Asociación de Prueba' } })
    goToLastStep()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('No fue posible guardar el perfil institucional.')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Atrás' }))
    fireEvent.click(screen.getByRole('button', { name: 'Atrás' }))
    fireEvent.click(screen.getByRole('button', { name: 'Atrás' }))
    expect(screen.getByLabelText(/Nombre legal/)).toHaveValue('Asociación de Prueba')
  })

  it('disables the form and exposes saving state', () => {
    vi.mocked(useUpdateInstitutionalProfile).mockReturnValue({ mutateAsync, isPending: true } as never)
    render(<InstitutionalProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
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

  it('keeps institutional data readable and hides every edit control without update permission', () => {
    permissionCodes = ['adm.institutional-profile.read']
    render(<InstitutionalProfilePage />)
    expect(screen.getByText('Datos institucionales')).toBeVisible()
    expect(screen.getAllByText('Sin validar o cargar')).not.toHaveLength(0)
    expect(screen.queryByRole('button', { name: /Editar perfil|Guardar cambios|Cancelar/ })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Nombre legal/)).not.toBeInTheDocument()
  })

  it('restores server values when editing is cancelled', () => {
    const profile = { ...emptyProfile, legalName: 'Asociación de Curime' }
    vi.mocked(useInstitutionalProfile).mockReturnValue({ data: profile, isPending: false, isError: false, error: null, refetch: vi.fn() } as never)
    render(<InstitutionalProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))
    fireEvent.change(screen.getByLabelText(/Nombre legal/), { target: { value: 'Cambio local' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByText('Asociación de Curime')).toBeVisible()
    expect(screen.queryByLabelText(/Nombre legal/)).not.toBeInTheDocument()
  })
})
