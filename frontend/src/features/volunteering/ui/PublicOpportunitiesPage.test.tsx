import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/features/auth'
import { usePublicOpportunities, usePublicOpportunity, useSubmitVolunteerApplication } from '../hooks/usePublicOpportunities'
import { PublicOpportunitiesPage } from './PublicOpportunitiesPage'
import { PublicOpportunityDetailPage } from './PublicOpportunityDetailPage'

vi.mock('@/features/auth', () => ({ useAuth: vi.fn() }))
vi.mock('../hooks/usePublicOpportunities', () => ({ usePublicOpportunities: vi.fn(), usePublicOpportunity: vi.fn(), useSubmitVolunteerApplication: vi.fn() }))

const item = { id: 7, title: 'Limpieza del parque', description: 'Jornada comunitaria', location: 'Parque central', capacity: 20, applicationDeadline: '2026-11-30T00:00:00.000Z', acceptingApplications: true }

describe('public volunteering pages', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false } as never); vi.mocked(useSubmitVolunteerApplication).mockReturnValue({ isPending: false, isSuccess: false, mutateAsync: vi.fn() } as never) })

  it('shows published opportunities with available metadata and searches via the public query', () => {
    vi.mocked(usePublicOpportunities).mockReturnValue({ isPending: false, isError: false, data: { data: [item], total: 1, page: 1, limit: 12 } } as never)
    render(<MemoryRouter><PublicOpportunitiesPage /></MemoryRouter>)
    expect(screen.getByRole('navigation', { name: 'Ruta de navegación' })).toHaveTextContent('Voluntariado')
    expect(screen.getByRole('heading', { name: 'Voluntariado', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('search')).toHaveClass('w-full', 'min-w-0', 'sm:flex-row')
    expect(screen.getByLabelText('Buscar oportunidades')).toHaveClass('min-w-0', 'flex-1')
    expect(screen.getByRole('button', { name: 'Buscar' })).toHaveClass('min-h-11', 'focus-visible:outline-3')
    const card = screen.getByRole('article')
    expect(card).toHaveClass('h-full', 'min-w-0', 'rounded-surface', 'flex-col')
    expect(card.parentElement).toHaveClass('grid', 'min-w-0', 'md:grid-cols-2', 'xl:grid-cols-3')
    expect(within(card).getByText('Jornada comunitaria')).toHaveClass('text-pretty', 'leading-relaxed')
    expect(within(card).getByText('Ubicación').nextElementSibling).toHaveTextContent('Parque central')
    expect(within(card).getByText('Fecha límite').nextElementSibling).toHaveTextContent('2026')
    expect(within(card).getByText('Postulaciones abiertas')).toBeVisible()
    expect(within(card).getByRole('link', { name: 'Ver detalle de Limpieza del parque' })).toHaveAttribute('href', '/voluntariado/7')
    expect(within(card).getAllByRole('link')).toHaveLength(2)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'No hay oportunidades por ahora' })).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Buscar oportunidades'), { target: { value: 'parque' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(usePublicOpportunities).toHaveBeenLastCalledWith({ search: 'parque', page: 1, limit: 12 })
  })

  it('clears the current search with the existing clear control', () => {
    vi.mocked(usePublicOpportunities).mockReturnValue({ isPending: false, isError: false, data: { data: [item], total: 1, page: 1, limit: 12 } } as never)
    render(<MemoryRouter><PublicOpportunitiesPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Buscar oportunidades'), { target: { value: 'parque' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }))
    expect(screen.getByLabelText('Buscar oportunidades')).toHaveValue('')
    expect(usePublicOpportunities).toHaveBeenLastCalledWith({ page: 1, limit: 12 })
  })

  it('keeps the existing pagination connected to the page query', () => {
    vi.mocked(usePublicOpportunities).mockReturnValue({ isPending: false, isError: false, data: { data: [item], total: 24, page: 1, limit: 12 } } as never)
    render(<MemoryRouter><PublicOpportunitiesPage /></MemoryRouter>)
    expect(screen.getByRole('navigation', { name: 'Paginación de oportunidades' })).toHaveTextContent('Página 1 de 2')
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(usePublicOpportunities).toHaveBeenLastCalledWith({ page: 2, limit: 12 })
  })

  it('shows the shared loading state', () => {
    vi.mocked(usePublicOpportunities).mockReturnValue({ isPending: true, isError: false } as never)
    render(<MemoryRouter><PublicOpportunitiesPage /></MemoryRouter>)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando oportunidades')
    expect(screen.getByRole('status')).toHaveClass('rounded-surface', 'border', 'bg-surface-card')
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('explains when no opportunities are published without adding sample opportunities', () => {
    vi.mocked(usePublicOpportunities).mockReturnValue({ isPending: false, isError: false, data: { data: [], total: 0, page: 1, limit: 12 } } as never)
    render(<MemoryRouter><PublicOpportunitiesPage /></MemoryRouter>)
    const emptyState = screen.getByRole('status')
    expect(emptyState).toHaveAttribute('aria-live', 'polite')
    expect(within(emptyState).getByRole('heading', { name: 'No hay oportunidades por ahora' })).toBeVisible()
    expect(within(emptyState).getByText('Actualmente no hay oportunidades de voluntariado publicadas. Consulte nuevamente más adelante.')).toBeVisible()
    expect(emptyState.querySelector('section')).toHaveClass('w-full', 'min-w-0', 'max-w-2xl', 'p-5', 'sm:p-7')
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Paginación de oportunidades' })).not.toBeInTheDocument()
  })

  it('shows a search-specific message and preserves the existing clear-search control when there are no matches', () => {
    vi.mocked(usePublicOpportunities).mockReturnValue({ isPending: false, isError: false, data: { data: [], total: 0, page: 1, limit: 12 } } as never)
    render(<MemoryRouter><PublicOpportunitiesPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Buscar oportunidades'), { target: { value: 'jardinería' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))

    const emptyState = screen.getByRole('status')
    expect(within(emptyState).getByRole('heading', { name: 'No encontramos coincidencias' })).toBeVisible()
    expect(within(emptyState).getByText(/No hay oportunidades publicadas que coincidan con “jardinería”/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Limpiar' })).toBeVisible()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }))

    expect(screen.getByLabelText('Buscar oportunidades')).toHaveValue('')
    expect(screen.getByRole('heading', { name: 'No hay oportunidades por ahora' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Limpiar' })).not.toBeInTheDocument()
    expect(usePublicOpportunities).toHaveBeenLastCalledWith({ page: 1, limit: 12 })
  })

  it('shows the shared error state and keeps its retry action', () => {
    const refetch = vi.fn()
    vi.mocked(usePublicOpportunities).mockReturnValue({ isPending: false, isError: true, error: new Error('offline'), refetch } as never)
    render(<MemoryRouter><PublicOpportunitiesPage /></MemoryRouter>)
    expect(screen.getByRole('alert')).toHaveTextContent('No fue posible cargar las oportunidades')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('keeps the error state exclusive when an empty cached result is present', () => {
    vi.mocked(usePublicOpportunities).mockReturnValue({ isPending: false, isError: true, error: new Error('offline'), data: { data: [], total: 0, page: 1, limit: 12 } } as never)
    render(<MemoryRouter><PublicOpportunitiesPage /></MemoryRouter>)
    expect(screen.getByRole('alert')).toHaveTextContent('No fue posible cargar las oportunidades')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'No hay oportunidades por ahora' })).not.toBeInTheDocument()
  })

  it('shows public detail and allows an anonymous applicant to open the form', () => {
    vi.mocked(usePublicOpportunity).mockReturnValue({ isPending: false, isError: false, data: { ...item, acceptingApplications: true } } as never)
    render(<MemoryRouter initialEntries={['/voluntariado/7']}><PublicOpportunityDetailPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: item.title })).toBeInTheDocument()
    expect(screen.getByText('Postulaciones abiertas')).toBeVisible()
    expect(screen.getByText('Ubicación').nextElementSibling).toHaveTextContent(item.location)
    expect(screen.getByText('Fecha límite').nextElementSibling).toHaveTextContent('2026')
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Crear una cuenta' })).toHaveAttribute('href', '/register')
    fireEvent.click(screen.getByRole('button', { name: 'Postularme como voluntario' }))
    expect(screen.getByRole('heading', { name: 'Postularme como voluntario' })).toBeInTheDocument()
  })

  it('uses the same community form with a session and shows a closed call', () => {
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true } as never)
    vi.mocked(usePublicOpportunity).mockReturnValue({ isPending: false, isError: false, data: { ...item, acceptingApplications: false } } as never)
    render(<MemoryRouter initialEntries={['/voluntariado/7']}><PublicOpportunityDetailPage /></MemoryRouter>)
    expect(screen.getByText('Convocatoria cerrada para nuevas postulaciones.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Postularme como voluntario' })).not.toBeInTheDocument()
  })

  it('shows a shared loading state on the detail page', () => {
    vi.mocked(usePublicOpportunity).mockReturnValue({ isPending: true, isError: false } as never)
    render(<MemoryRouter initialEntries={['/voluntariado/7']}><Routes><Route path="/voluntariado/:id" element={<PublicOpportunityDetailPage />} /></Routes></MemoryRouter>)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando oportunidad')
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })
})
