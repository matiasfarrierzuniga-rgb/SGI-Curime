import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { MineAssembliesPage } from './MineAssembliesPage'

const useMineAssemblies = vi.fn()
vi.mock('../hooks/useAssembliesQueries', () => ({ useMineAssemblies: () => useMineAssemblies() }))

describe('MineAssembliesPage', () => {
  beforeEach(() => useMineAssemblies.mockReset())

  it('shows loading and empty states', () => {
    useMineAssemblies.mockReturnValue({ isPending: true })
    const { rerender } = render(<MemoryRouter><MineAssembliesPage /></MemoryRouter>)
    expect(screen.getByText(/Cargando sus asambleas/i)).toBeInTheDocument()
    useMineAssemblies.mockReturnValue({ isPending: false, data: [] })
    rerender(<MemoryRouter><MineAssembliesPage /></MemoryRouter>)
    expect(screen.getByText(/No tiene asambleas convocadas/i)).toBeInTheDocument()
  })

  it('shows only read-only historical convocation information', () => {
    useMineAssemblies.mockReturnValue({ isPending: false, data: [{ id: 1, roleNameSnapshot: 'Fiscal', assembly: { id: 1, title: 'Asamblea general', date: '2026-09-20T18:00:00.000Z', place: 'Salón comunal', description: null, status: 'COMPLETED', attendanceStatus: 'PRESENT', justification: null } }] })
    render(<MemoryRouter><MineAssembliesPage /></MemoryRouter>)
    expect(screen.getByText('Asamblea general')).toBeInTheDocument()
    expect(screen.getByText(/Rol al momento de la convocatoria: Fiscal/)).toBeInTheDocument()
    expect(screen.getByText('Finalizada · Asistió')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows a recoverable error state', () => {
    useMineAssemblies.mockReturnValue({ isPending: false, isError: true, error: new Error('falló') })
    render(<MemoryRouter><MineAssembliesPage /></MemoryRouter>)
    expect(screen.getByText(/No fue posible cargar sus asambleas/i)).toBeInTheDocument()
  })

  it.each([
    ['SCHEDULED', null, null, 'Convocado'],
    ['IN_PROGRESS', null, null, 'Asamblea en curso'],
    ['COMPLETED', 'ABSENT', { id: 1, status: 'PENDING' }, 'Finalizada · Ausente · Justificación enviada'],
    ['COMPLETED', 'JUSTIFIED', { id: 1, status: 'APPROVED' }, 'Finalizada · Ausencia justificada'],
    ['COMPLETED', 'ABSENT', { id: 1, status: 'REJECTED' }, 'Finalizada · Justificación rechazada'],
  ])('shows personal state %s', (status, attendanceStatus, justification, label) => {
    useMineAssemblies.mockReturnValue({ isPending: false, data: [{ id: 1, roleNameSnapshot: 'Fiscal', assembly: { id: 4, title: 'Asamblea', date: '2026-09-20T18:00:00Z', place: 'Salón', description: null, status, attendanceStatus, justification } }] })
    render(<MemoryRouter><MineAssembliesPage /></MemoryRouter>)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('offers the existing justification flow only for completed absence without a request', () => {
    useMineAssemblies.mockReturnValue({ isPending: false, data: [{ id: 1, roleNameSnapshot: 'Fiscal', assembly: { id: 4, title: 'Asamblea', date: '2026-09-20T18:00:00Z', place: 'Salón', description: null, status: 'COMPLETED', attendanceStatus: 'ABSENT', justification: null } }] })
    render(<MemoryRouter><MineAssembliesPage /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Justificar ausencia' })).toHaveAttribute('href', '/app/affiliate/absence-justifications/new?assemblyId=4')
    expect(screen.queryByText('Presente')).not.toBeInTheDocument()
  })
})
