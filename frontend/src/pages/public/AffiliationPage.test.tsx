import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { affiliationSchema, type AffiliationFormValues } from '@/features/affiliate-requests'
import { AffiliationPage } from './AffiliationPage'
import { affiliateRequestsService } from '../../services/affiliateRequestsService'

vi.mock('../../services/affiliateRequestsService', () => ({ affiliateRequestsService: { create: vi.fn() } }))
vi.mock('sonner', () => ({ Toaster: () => null, toast: { success: vi.fn(), error: vi.fn() } }))

const validForm: AffiliationFormValues = {
  firstName: 'Ana', firstSurname: 'Pérez', secondSurname: '', identificationType: 'NATIONAL', identification: '123456789',
  birthDate: '1990-01-01', gender: '', phoneCountryCode: '', phoneNationalNumber: '', email: '', address: 'Curime', occupation: '', workplace: '', affiliationReason: 'Participar',
}

describe('AffiliationPage', () => {
  beforeEach(() => {
    vi.mocked(affiliateRequestsService.create).mockReset()
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
  })

  function fillRequiredFields() {
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: ' Ana ' } })
    fireEvent.change(screen.getByLabelText('Primer apellido'), { target: { value: ' Pérez ' } })
    fireEvent.change(screen.getByLabelText('Número de identificación'), { target: { value: '123456789abc' } })
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '1990-01-01' } })
    fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: ' Curime ' } })
    fireEvent.change(screen.getByLabelText('Motivo para afiliarse'), { target: { value: ' Participar ' } })
  }

  function LocationProbe() {
    return <output data-testid="location">{useLocation().pathname}</output>
  }

  it('renders structured identity fields, rejects missing required names, and focuses the first error', async () => {
    render(<MemoryRouter><AffiliationPage/></MemoryRouter>)

    const firstName = screen.getByLabelText('Nombre')
    expect(firstName).toBeRequired()
    expect(screen.getByLabelText('Primer apellido')).toBeRequired()
    expect(screen.getByLabelText('Segundo apellido (opcional)')).not.toBeRequired()
    expect(screen.queryByLabelText('Nombre completo')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    await waitFor(() => {
      expect(firstName).toHaveAttribute('aria-invalid', 'true')
      expect(firstName).toHaveFocus()
    })

    const errorId = firstName.getAttribute('aria-describedby')
    expect(errorId).toBeTruthy()
    expect(document.getElementById(errorId!)).toHaveTextContent('Este campo es obligatorio.')
    expect(affiliateRequestsService.create).not.toHaveBeenCalled()
  })

  it('validates NATIONAL and DIMEX identification on blur and revalidates on change', async () => {
    render(<MemoryRouter><AffiliationPage/></MemoryRouter>)
    const identification = screen.getByLabelText('Número de identificación')

    fireEvent.change(identification, { target: { value: '123' } })
    fireEvent.blur(identification)
    expect(await screen.findByText(/exactamente 9 dígitos/i)).toBeInTheDocument()

    fireEvent.change(identification, { target: { value: '123456789' } })
    await waitFor(() => expect(screen.queryByText(/exactamente 9 dígitos/i)).not.toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('Tipo de identificación'), { target: { value: 'DIMEX' } })
    fireEvent.change(identification, { target: { value: '123' } })
    fireEvent.blur(identification)
    expect(await screen.findByText(/exactamente 12 dígitos/i)).toBeInTheDocument()
  })

  it('rejects invalid and future birth dates in the schema', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const futureDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`

    expect(affiliationSchema.safeParse({ ...validForm, birthDate: '2025-02-30' }).success).toBe(false)
    expect(affiliationSchema.safeParse({ ...validForm, birthDate: futureDate }).success).toBe(false)
  })

  it('accepts an empty phone and rejects incomplete phone pairs', () => {
    expect(affiliationSchema.safeParse(validForm).success).toBe(true)
    expect(affiliationSchema.safeParse({ ...validForm, phoneCountryCode: '+506' }).success).toBe(false)
    expect(affiliationSchema.safeParse({ ...validForm, phoneNationalNumber: '88881234' }).success).toBe(false)
  })

  it('submits structured identity and preserves optional fields without fullName', async () => {
    vi.mocked(affiliateRequestsService.create).mockResolvedValue({} as never)
    render(<MemoryRouter><AffiliationPage/></MemoryRouter>)
    fillRequiredFields()
    fireEvent.change(screen.getByLabelText('Segundo apellido (opcional)'), { target: { value: ' Mora ' } })
    fireEvent.change(screen.getByLabelText('Género (opcional)'), { target: { value: 'Femenino' } })
    fireEvent.change(screen.getByLabelText('Teléfono (opcional)'), { target: { value: '+50688881234' } })
    fireEvent.change(screen.getByLabelText('Correo (opcional)'), { target: { value: ' ANA@EXAMPLE.COM ' } })
    fireEvent.change(screen.getByLabelText('Ocupación (opcional)'), { target: { value: ' Docente ' } })
    fireEvent.change(screen.getByLabelText('Lugar de trabajo (opcional)'), { target: { value: ' Escuela ' } })

    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    await waitFor(() => expect(affiliateRequestsService.create).toHaveBeenCalledWith({
      firstName: 'Ana', firstSurname: 'Pérez', secondSurname: 'Mora',
      identificationType: 'NATIONAL', identification: '123456789',
      birthDate: new Date('1990-01-01T12:00:00').toISOString(), gender: 'Femenino',
      phoneCountryCode: '+506', phoneNationalNumber: '88881234', email: 'ana@example.com',
      address: 'Curime', occupation: 'Docente', workplace: 'Escuela', affiliationReason: 'Participar',
    }))
    expect(vi.mocked(affiliateRequestsService.create).mock.calls[0][0]).not.toHaveProperty('fullName')
    expect(vi.mocked(affiliateRequestsService.create).mock.calls[0][0]).not.toHaveProperty('affiliateType')
    expect(toast.success).toHaveBeenCalledWith('Solicitud enviada correctamente. La ADI revisará la información.')
    expect(screen.getByLabelText('Nombre')).toHaveValue('')
  })

  it('omits blank optional second surname and safely shows conflicts', async () => {
    const conflict = Object.assign(new Error('conflict'), { isAxiosError: true, response: { status: 409 } })
    vi.mocked(affiliateRequestsService.create).mockRejectedValue(conflict)
    render(<MemoryRouter><AffiliationPage/></MemoryRouter>)
    fillRequiredFields()
    fireEvent.change(screen.getByLabelText('Segundo apellido (opcional)'), { target: { value: '   ' } })
    const button = screen.getByRole('button', { name: 'Enviar solicitud' })
    fireEvent.click(button)

    await waitFor(() => expect(affiliateRequestsService.create).toHaveBeenCalledTimes(1))
    expect(affiliateRequestsService.create).toHaveBeenCalledTimes(1)
    expect(vi.mocked(affiliateRequestsService.create).mock.calls[0][0]).not.toHaveProperty('secondSurname')
    expect(vi.mocked(affiliateRequestsService.create).mock.calls[0][0]).not.toHaveProperty('phoneCountryCode')
    expect(vi.mocked(affiliateRequestsService.create).mock.calls[0][0]).not.toHaveProperty('phoneNationalNumber')
    expect(toast.error).toHaveBeenCalledWith('No se pudo completar la operación por un conflicto con los datos.')
    expect(screen.getByLabelText('Nombre')).toHaveValue(' Ana ')
  })

  it('prevents double submission while the affiliation request is pending', async () => {
    let release!: () => void
    vi.mocked(affiliateRequestsService.create).mockImplementation(
      () => new Promise(resolve => { release = () => resolve({} as never) }),
    )
    render(<MemoryRouter><AffiliationPage/></MemoryRouter>)
    fillRequiredFields()
    const button = screen.getByRole('button', { name: 'Enviar solicitud' })

    fireEvent.click(button)
    fireEvent.click(button)

    await waitFor(() => expect(button).toBeDisabled())
    expect(button).toHaveTextContent('Enviando…')
    expect(affiliateRequestsService.create).toHaveBeenCalledTimes(1)

    release()
    await waitFor(() => expect(toast.success).toHaveBeenCalled())
  })

  it('keeps successful affiliation public without creating a frontend session', async () => {
    localStorage.removeItem('sgi-curime-session')
    vi.mocked(affiliateRequestsService.create).mockResolvedValue({} as never)
    render(<MemoryRouter initialEntries={['/afiliacion']}><AffiliationPage/><LocationProbe/></MemoryRouter>)
    fillRequiredFields()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    await waitFor(() => expect(toast.success).toHaveBeenCalled())
    expect(localStorage.getItem('sgi-curime-session')).toBeNull()
    expect(screen.getByTestId('location')).toHaveTextContent('/afiliacion')
  })
})
