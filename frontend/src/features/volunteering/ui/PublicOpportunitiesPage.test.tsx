import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/features/auth'
import { usePublicOpportunities, usePublicOpportunity, useSubmitVolunteerApplication } from '../hooks/usePublicOpportunities'
import { PublicOpportunitiesPage } from './PublicOpportunitiesPage'
import { PublicOpportunityDetailPage } from './PublicOpportunityDetailPage'

vi.mock('@/features/auth', () => ({ useAuth: vi.fn() }))
vi.mock('../hooks/usePublicOpportunities', () => ({ usePublicOpportunities: vi.fn(), usePublicOpportunity: vi.fn(), useSubmitVolunteerApplication: vi.fn() }))

const item = { id: 7, title: 'Limpieza del parque', description: 'Jornada comunitaria', location: 'Parque central', capacity: 20, applicationDeadline: null }

describe('public volunteering pages', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false } as never); vi.mocked(useSubmitVolunteerApplication).mockReturnValue({ isPending: false, isSuccess: false, mutateAsync: vi.fn() } as never) })

  it('shows published opportunities and searches via the public query', () => {
    vi.mocked(usePublicOpportunities).mockReturnValue({ isPending: false, isError: false, data: { data: [item], total: 1, page: 1, limit: 12 } } as never)
    render(<MemoryRouter><PublicOpportunitiesPage /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Ver detalle' })).toHaveAttribute('href', '/voluntariado/7')
    fireEvent.change(screen.getByLabelText('Buscar oportunidades'), { target: { value: 'parque' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(usePublicOpportunities).toHaveBeenLastCalledWith({ search: 'parque', page: 1, limit: 12 })
  })

  it('shows empty and error states', () => {
    vi.mocked(usePublicOpportunities).mockReturnValue({ isPending: false, isError: false, data: { data: [], total: 0, page: 1, limit: 12 } } as never)
    const view = render(<MemoryRouter><PublicOpportunitiesPage /></MemoryRouter>)
    expect(screen.getByText('No hay oportunidades publicadas')).toBeInTheDocument()
    view.unmount()
    vi.mocked(usePublicOpportunities).mockReturnValue({ isPending: false, isError: true, error: new Error('offline'), refetch: vi.fn() } as never)
    render(<MemoryRouter><PublicOpportunitiesPage /></MemoryRouter>)
    expect(screen.getByText('No fue posible cargar las oportunidades')).toBeInTheDocument()
  })

  it('shows public detail and allows an anonymous applicant to open the form', () => {
    vi.mocked(usePublicOpportunity).mockReturnValue({ isPending: false, isError: false, data: { ...item, acceptingApplications: true } } as never)
    render(<MemoryRouter initialEntries={['/voluntariado/7']}><PublicOpportunityDetailPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: item.title })).toBeInTheDocument()
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
})
