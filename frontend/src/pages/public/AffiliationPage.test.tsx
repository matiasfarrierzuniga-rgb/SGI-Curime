import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AffiliationPage } from './AffiliationPage'
import { affiliateRequestsService } from '../../services/affiliateRequestsService'

vi.mock('../../services/affiliateRequestsService', () => ({ affiliateRequestsService: { create: vi.fn() } }))

describe('AffiliationPage', () => {
  beforeEach(() => {
    vi.mocked(affiliateRequestsService.create).mockReset()
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

  it('renders structured identity fields and rejects missing required names', () => {
    render(<MemoryRouter><AffiliationPage/></MemoryRouter>)

    expect(screen.getByLabelText('Nombre')).toBeRequired()
    expect(screen.getByLabelText('Primer apellido')).toBeRequired()
    expect(screen.getByLabelText('Segundo apellido (opcional)')).not.toBeRequired()
    expect(screen.queryByLabelText('Nombre completo')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    expect(screen.getAllByText('Este campo es obligatorio.')).toHaveLength(2)
    expect(affiliateRequestsService.create).not.toHaveBeenCalled()
  })

  it('preserves supported identification validation', () => {
    render(<MemoryRouter><AffiliationPage/></MemoryRouter>)
    const identification = screen.getByLabelText('Número de identificación')

    fireEvent.change(identification, { target: { value: '123' } })
    fireEvent.blur(identification)
    expect(screen.getByText(/exactamente 9 dígitos/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Tipo de identificación'), { target: { value: 'DIMEX' } })
    fireEvent.change(identification, { target: { value: '123' } })
    fireEvent.blur(identification)
    expect(screen.getByText(/exactamente 12 dígitos/i)).toBeInTheDocument()
  })

  it('submits structured identity and preserves optional fields without fullName', async () => {
    vi.mocked(affiliateRequestsService.create).mockResolvedValue({} as never)
    render(<MemoryRouter><AffiliationPage/></MemoryRouter>)
    fillRequiredFields()
    fireEvent.change(screen.getByLabelText('Segundo apellido (opcional)'), { target: { value: ' Mora ' } })
    fireEvent.change(screen.getByLabelText('Género (opcional)'), { target: { value: 'Femenino' } })
    fireEvent.change(screen.getByLabelText('Número (opcional)'), { target: { value: '88881234' } })
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
    expect(screen.getByRole('status')).toHaveTextContent(/solicitud enviada/i)
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
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo completar la operación por un conflicto con los datos.')
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
    await waitFor(() => expect(screen.getByText(/solicitud enviada correctamente/i)).toBeInTheDocument())
  })

  it('keeps successful affiliation public without creating a frontend session', async () => {
    localStorage.removeItem('sgi-curime-session')
    vi.mocked(affiliateRequestsService.create).mockResolvedValue({} as never)
    render(<MemoryRouter initialEntries={['/afiliacion']}><AffiliationPage/><LocationProbe/></MemoryRouter>)
    fillRequiredFields()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    await waitFor(() => expect(screen.getByText(/solicitud enviada correctamente/i)).toBeInTheDocument())
    expect(localStorage.getItem('sgi-curime-session')).toBeNull()
    expect(screen.getByTestId('location')).toHaveTextContent('/afiliacion')
  })
})
