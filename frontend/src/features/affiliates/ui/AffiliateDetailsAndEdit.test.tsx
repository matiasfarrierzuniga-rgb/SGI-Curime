import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { affiliatesService } from '../api/affiliates.api'
import { affiliatesKeys } from '../hooks/useAffiliatesQueries'
import { AffiliateDetailsModal } from './AffiliateDetailsModal'
import { EditAffiliateModal } from './EditAffiliateModal'

vi.mock('../api/affiliates.api', () => ({
  affiliatesService: { list: vi.fn(), detail: vi.fn(), update: vi.fn(), activate: vi.fn(), deactivate: vi.fn() },
}))

const affiliate = {
  id: 7,
  fullName: 'Ana Pérez',
  identification: '123456789',
  identificationType: 'NATIONAL' as const,
  birthDate: '1990-01-01T00:00:00.000Z',
  gender: 'Femenino',
  phoneCountryCode: '+506',
  phoneNationalNumber: '88888888',
  phone: '8888-8888',
  email: 'ana@example.test',
  address: 'San José',
  occupation: 'Docente',
  workplace: 'Escuela',
  affiliateType: 'Asociado',
  affiliationDate: '2026-01-15T00:00:00.000Z',
  status: 'ACTIVE' as const,
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  return { queryClient, ...render(ui, { wrapper }) }
}

describe('Affiliate detail and edit', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loads affiliate detail and shows its visible status', async () => {
    vi.mocked(affiliatesService.detail).mockResolvedValue(affiliate)
    const edit = vi.fn()

    renderWithClient(<AffiliateDetailsModal id={7} onClose={vi.fn()} onEdit={edit} />)

    expect(screen.getByRole('status')).toHaveTextContent('Cargando detalle del afiliado...')
    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.getByText('Activo', { selector: 'span' })).toBeInTheDocument()
    expect(affiliatesService.detail).toHaveBeenCalledWith(7)
    fireEvent.click(screen.getByRole('button', { name: 'Editar datos' }))
    expect(edit).toHaveBeenCalledWith(affiliate)
  })

  it('shows detail loading errors without using list data as detail data', async () => {
    vi.mocked(affiliatesService.detail).mockRejectedValue(new Error('fallo'))

    renderWithClient(<AffiliateDetailsModal id={7} onClose={vi.fn()} onEdit={vi.fn()} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible cargar el detalle del afiliado.')
  })

  it('initializes editable fields and sends only an AffiliateUpdate payload', async () => {
    vi.mocked(affiliatesService.update).mockResolvedValue(affiliate)
    const close = vi.fn()
    const { queryClient } = renderWithClient(<EditAffiliateModal affiliate={affiliate} onClose={close} />)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Ana Pérez')
    expect(screen.getByLabelText('Identificación')).toHaveValue('123456789')
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana Nueva' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(affiliatesService.update).toHaveBeenCalledWith(7, expect.objectContaining({ fullName: 'Ana Nueva' })))
    const payload = vi.mocked(affiliatesService.update).mock.calls[0][1] as Record<string, unknown>
    expect(payload).not.toHaveProperty('id')
    expect(payload).not.toHaveProperty('status')
    expect(payload).not.toHaveProperty('affiliationDate')
    expect(payload).not.toHaveProperty('createdAt')
    expect(payload).not.toHaveProperty('updatedAt')
    await waitFor(() => expect(close).toHaveBeenCalledOnce())
    expect(invalidate).toHaveBeenCalledWith({ queryKey: affiliatesKeys.all })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: affiliatesKeys.detail(7) })
  })

  it('disables repeated submits while update is pending', async () => {
    let resolve!: (value: typeof affiliate) => void
    vi.mocked(affiliatesService.update).mockReturnValue(new Promise((next) => { resolve = next }))
    renderWithClient(<EditAffiliateModal affiliate={affiliate} onClose={vi.fn()} />)

    const save = screen.getByRole('button', { name: 'Guardar cambios' })
    fireEvent.click(save)
    fireEvent.click(save)

    expect(await screen.findByRole('button', { name: 'Guardando…' })).toBeDisabled()
    expect(affiliatesService.update).toHaveBeenCalledTimes(1)
    resolve(affiliate)
  })

  it('shows update errors, including conflict responses', async () => {
    vi.mocked(affiliatesService.update).mockRejectedValue({ isAxiosError: true, response: { status: 409, data: { message: 'Duplicate' } } })
    renderWithClient(<EditAffiliateModal affiliate={affiliate} onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo completar la operación por un conflicto con los datos.')
  })
})
