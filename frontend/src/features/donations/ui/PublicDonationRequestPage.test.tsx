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
    expect(screen.getByRole('complementary', { name: 'La solicitud no procesa un pago' })).toBeVisible()
    expect(screen.getByText('Este formulario registra una intención de donar. No procesa pagos ni confirma recepción de bienes.')).toBeVisible()
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Persona donante' } })
    fireEvent.change(screen.getByLabelText(/Monto aproximado/), { target: { value: '10000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    expect(await screen.findByText('Indique un correo o un teléfono.')).toBeVisible()
    expect(create).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: 'persona@example.org' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ donorName: 'Persona donante', email: 'persona@example.org', kind: 'MONETARY', approximateAmount: '10000' }), expect.any(String)))
    const confirmation = screen.getByRole('status')
    expect(await screen.findByText('Solicitud recibida')).toBeVisible()
    expect(confirmation).toHaveClass('mx-auto', 'w-full', 'max-w-3xl', 'sm:p-7')
    expect(screen.getByText(/no confirma una donación ni un pago/i)).toBeVisible()
    expect(screen.queryByText(/pago recibido|dinero recibido|donación confirmada/i)).not.toBeInTheDocument()
  })

  it('groups the form and guidance panel responsively without changing the fields', () => {
    renderPage()
    const formHeading = screen.getByRole('heading', { name: 'Cuéntenos cómo desea ayudar' })
    const form = formHeading.closest('form')!
    const layout = form.parentElement!

    expect(layout).toHaveClass('grid', 'min-w-0', 'lg:grid-cols-[minmax(0,1.55fr)_minmax(17rem,0.75fr)]')
    expect(form).toHaveClass('min-w-0', 'p-4', 'sm:p-6', 'lg:p-7')
    expect(screen.getByRole('heading', { name: 'Datos de contacto' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Información del aporte' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Información adicional' })).toBeVisible()
    expect(screen.getByLabelText(/Correo electrónico/)).toBeVisible()
    expect(screen.getByLabelText(/Teléfono/)).toBeVisible()
  })

  it('exposes the in-progress request and prevents a duplicate submit', async () => {
    create.mockReturnValueOnce(new Promise(() => {}))
    renderPage()
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Persona donante' } })
    fireEvent.change(screen.getByLabelText(/Monto aproximado/), { target: { value: '10000' } })
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: 'persona@example.org' } })
    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/ }))

    const submit = await screen.findByRole('button', { name: /Enviando solicitud/ })
    expect(submit).toBeDisabled()
    expect(submit).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('presents request errors accessibly and retains entered values for retry', async () => {
    create.mockRejectedValueOnce(new Error('Servicio no disponible'))
    renderPage()
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Persona donante' } })
    fireEvent.change(screen.getByLabelText(/Monto aproximado/), { target: { value: '10000' } })
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: 'persona@example.org' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('No fue posible enviar la solicitud. Inténtelo nuevamente.')
    expect(alert).toHaveClass('p-3', 'text-body-small')
    expect(screen.getByLabelText(/Nombre/)).toHaveValue('Persona donante')
    expect(screen.getByLabelText(/Correo electrónico/)).toHaveValue('persona@example.org')
    expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeEnabled()
    expect(screen.queryByText('Solicitud recibida')).not.toBeInTheDocument()
  })

  it('only offers presencial or coordinated delivery for goods', () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/Tipo de aporte/), { target: { value: 'IN_KIND' } })
    expect(screen.getByRole('option', { name: 'Coordinada' })).toBeVisible()
    expect(screen.queryByRole('option', { name: 'Digital' })).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Descripción de los bienes/)).toBeVisible()
  })
})
