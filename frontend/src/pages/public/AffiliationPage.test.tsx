import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AffiliationPage } from './AffiliationPage'
import { affiliateRequestsService } from '../../services/affiliateRequestsService'

vi.mock('../../services/affiliateRequestsService', () => ({ affiliateRequestsService: { create: vi.fn() } }))

describe('AffiliationPage', () => {
  it('uses atomic normalized fields and submits only once', async () => {
    let release!: () => void
    vi.mocked(affiliateRequestsService.create).mockImplementation(() => new Promise(resolve => { release = () => resolve({} as never) }))
    render(<MemoryRouter><AffiliationPage/></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana Pérez' } })
    fireEvent.change(screen.getByLabelText('Número de identificación'), { target: { value: '123456789abc' } })
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '1990-01-01' } })
    fireEvent.change(screen.getByLabelText('Correo (opcional)'), { target: { value: ' ANA@EXAMPLE.COM ' } })
    fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'Curime' } })
    fireEvent.change(screen.getByLabelText('Motivo para afiliarse'), { target: { value: 'Participar' } })
    const button = screen.getByRole('button', { name: 'Enviar solicitud' })
    fireEvent.click(button); fireEvent.click(button)
    await waitFor(() => expect(button).toBeDisabled())
    expect(affiliateRequestsService.create).toHaveBeenCalledTimes(1)
    expect(affiliateRequestsService.create).toHaveBeenCalledWith(expect.objectContaining({ identificationType: 'NATIONAL', identification: '123456789', email: 'ana@example.com' }))
    release()
  })
})
