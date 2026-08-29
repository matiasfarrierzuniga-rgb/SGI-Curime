import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { affiliatesService } from '../api/affiliates.api'
import { AffiliatesPage } from './AffiliatesPage'

vi.mock('../api/affiliates.api', () => ({
  affiliatesService: { list: vi.fn() },
}))

const affiliate = {
  id: 7,
  fullName: 'Ana Pérez',
  identification: '1-2345-6789',
  identificationType: 'NATIONAL' as const,
  birthDate: '1990-01-01T00:00:00.000Z',
  gender: null,
  phoneCountryCode: '+506',
  phoneNationalNumber: '88888888',
  phone: '8888-8888',
  email: 'ana@example.test',
  address: 'San José',
  occupation: null,
  workplace: null,
  affiliateType: 'Asociado',
  affiliationDate: '2026-01-15T00:00:00.000Z',
  status: 'ACTIVE' as const,
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
}

function page() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  return render(<AffiliatesPage />, { wrapper })
}

describe('AffiliatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(affiliatesService.list).mockResolvedValue({ data: [affiliate], total: 40, page: 1, limit: 20 })
  })

  it('shows loading, error, and empty states', async () => {
    let resolve!: (value: { data: []; total: number; page: number; limit: number }) => void
    vi.mocked(affiliatesService.list).mockReturnValueOnce(new Promise((next) => { resolve = next }))

    const view = page()
    expect(screen.getByRole('status')).toHaveTextContent('Cargando afiliados...')
    resolve({ data: [], total: 0, page: 1, limit: 20 })
    expect(await screen.findByRole('heading', { name: 'No hay afiliados' })).toBeInTheDocument()
    view.unmount()

    vi.mocked(affiliatesService.list).mockRejectedValueOnce(new Error('fallo'))
    page()
    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible cargar los afiliados.')
  })

  it('renders affiliate data and visible status labels', async () => {
    page()

    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.getByText('Activo', { selector: 'span' })).toBeInTheDocument()
  })

  it('renders inactive affiliates with a visible inactive label', async () => {
    vi.mocked(affiliatesService.list).mockResolvedValueOnce({ data: [{ ...affiliate, status: 'INACTIVE' as const }], total: 1, page: 1, limit: 20 })
    page()

    expect(await screen.findByText('Inactivo')).toBeInTheDocument()
  })

  it('searches and resets pagination to the first page', async () => {
    page()
    await screen.findByText('Ana Pérez')
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await waitFor(() => expect(affiliatesService.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })))

    fireEvent.change(screen.getByLabelText('Búsqueda'), { target: { value: 'Bea' } })
    await waitFor(() => expect(affiliatesService.list).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Bea', page: 1, status: undefined })))
  })

  it('filters by status and resets pagination to the first page', async () => {
    page()
    await screen.findByText('Ana Pérez')
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await waitFor(() => expect(affiliatesService.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })))

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'INACTIVE' } })
    await waitFor(() => expect(affiliatesService.list).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'INACTIVE', page: 1 })))
  })

  it('navigates pages and disables controls at pagination limits', async () => {
    page()
    await screen.findByText('Ana Pérez')
    const previous = screen.getByRole('button', { name: 'Anterior' })
    const next = screen.getByRole('button', { name: 'Siguiente' })

    expect(previous).toBeDisabled()
    fireEvent.click(next)
    await waitFor(() => expect(affiliatesService.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled())
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    await waitFor(() => expect(affiliatesService.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 })))
  })
})
