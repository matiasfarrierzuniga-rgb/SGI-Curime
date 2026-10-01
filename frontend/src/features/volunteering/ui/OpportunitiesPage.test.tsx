import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/features/auth'
import { OpportunitiesPage } from '@/features/volunteering'
import { httpClient } from '@/shared/api/httpClient'
import { useToast } from '@/shared/ui/Toast'

vi.mock('@/features/auth', () => ({ useAuth: vi.fn() }))
vi.mock('@/shared/ui/Toast', () => ({ useToast: vi.fn() }))

const opportunity = { id: 1, title: 'Limpieza de playa', description: null, location: null, capacity: null, applicationDeadline: null, status: 'PUBLISHED', createdByUserId: 4, createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z' } as const
const notify = vi.fn()
const OPPORTUNITY_MANAGER_PERMISSIONS = ['vol.opportunities.read', 'vol.opportunities.create', 'vol.opportunities.update']

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}><OpportunitiesPage /></QueryClientProvider>)
}

describe('OpportunitiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({ user: { permissionCodes: OPPORTUNITY_MANAGER_PERMISSIONS } } as never)
    vi.mocked(useToast).mockReturnValue({ notify } as never)
    vi.spyOn(httpClient, 'get').mockImplementation((url) => {
      if (url === '/volunteering/opportunities') return Promise.resolve({ data: { data: [opportunity], total: 1, page: 1, limit: 20 } })
      if (url === '/volunteering/opportunities/1') return Promise.resolve({ data: opportunity })
      throw new Error(`Unexpected HTTP request in OpportunitiesPage tests: ${url}`)
    })
    vi.spyOn(httpClient, 'patch').mockResolvedValue({ data: opportunity })
  })

  it('renders opportunity list through its public feature API', async () => {
    renderPage()
    expect((await screen.findAllByText('Limpieza de playa')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Publicada')).not.toHaveLength(0)
    expect(screen.getAllByText('Sin ubicación registrada')).not.toHaveLength(0)
    expect(screen.getAllByText('Sin fecha límite')).not.toHaveLength(0)
  })

  it('sends search and status filters through the approved HTTP client', async () => {
    renderPage()
    await screen.findAllByText('Limpieza de playa')
    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'playa' } })
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'CLOSED' } })
    await waitFor(() => expect(httpClient.get).toHaveBeenLastCalledWith('/volunteering/opportunities', { params: { search: 'playa', status: 'CLOSED', page: 1, limit: 20 } }))
  })

  it('disables and blocks unchanged edits to prevent no-op PATCH requests', async () => {
    renderPage()
    await screen.findAllByText('Limpieza de playa')
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver detalle' })[0])
    await screen.findByRole('heading', { name: 'Detalle de oportunidad' })
    const edit = await screen.findByRole('button', { name: 'Editar' })
    expect(edit).toBeInTheDocument()
    fireEvent.click(edit)
    const save = screen.getByRole('button', { name: 'Guardar cambios' })
    expect(save).toBeDisabled()
    fireEvent.submit(save.closest('form')!)
    expect(httpClient.patch).not.toHaveBeenCalled()
  })

  it('sends changed edit fields through the frozen PATCH contract', async () => {
    renderPage()
    await screen.findAllByText('Limpieza de playa')
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver detalle' })[0])
    await screen.findByRole('heading', { name: 'Detalle de oportunidad' })
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    const save = screen.getByRole('button', { name: 'Guardar cambios' })
    const form = save.closest('form')!
    const title = form.querySelector<HTMLInputElement>('#opportunity-title')
    if (!title) throw new Error('Opportunity title input was not rendered')
    fireEvent.change(title, { target: { value: 'Limpieza comunitaria' } })
    fireEvent.submit(form)
    await waitFor(() => expect(httpClient.patch).toHaveBeenCalledWith('/volunteering/opportunities/1', { title: 'Limpieza comunitaria', description: undefined, location: undefined, capacity: undefined, applicationDeadline: undefined }))
  })
})
