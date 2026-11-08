import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PublicDonationRequestPage } from './PublicDonationRequestPage'

const { create } = vi.hoisted(() => ({ create: vi.fn() }))
vi.mock('../api/donationRequests.api', () => ({ donationRequestsApi: { create } }))

function renderPage() {
  return render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><PublicDonationRequestPage /></MemoryRouter></QueryClientProvider>)
}

describe('PublicDonationRequestPage', () => {
  beforeEach(() => { create.mockReset().mockResolvedValue({ id: 'solicitud-1', status: 'PENDING' }) })

  it('requires contact and keeps confirmation separate from payment', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Persona donante' } })
    fireEvent.change(screen.getByLabelText(/Monto aproximado/), { target: { value: '10000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    expect(await screen.findByText('Indique un correo o un teléfono.')).toBeVisible()
    expect(create).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: 'persona@example.org' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ donorName: 'Persona donante', email: 'persona@example.org', kind: 'MONETARY', approximateAmount: '10000' }), expect.any(String)))
    expect(await screen.findByText('Solicitud recibida')).toBeVisible()
    expect(screen.getByText(/no confirma una donación ni un pago/i)).toBeVisible()
  })

  it('only offers presencial or coordinated delivery for goods', () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/Tipo de aporte/), { target: { value: 'IN_KIND' } })
    expect(screen.getByRole('option', { name: 'Coordinada' })).toBeVisible()
    expect(screen.queryByRole('option', { name: 'Digital' })).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Descripción de los bienes/)).toBeVisible()
  })
})
