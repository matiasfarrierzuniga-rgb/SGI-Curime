import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/features/auth'
import { FinancialSectionNav } from './FinancialSectionNav'

vi.mock('@/features/auth', () => ({ useAuth: vi.fn() }))

describe('FinancialSectionNav', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows only authorized Finance routes and marks current route', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { permissionCodes: ['fin.charges.read', 'fin.movements.read', 'fin.dinadeco.read'] } } as never)

    render(<MemoryRouter initialEntries={['/app/financial/movements']}><FinancialSectionNav /></MemoryRouter>)

    expect(screen.getByRole('navigation', { name: 'Secciones de gestión financiera' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Cargos/ })).toHaveAttribute('href', '/app/financial')
    expect(screen.getByRole('link', { name: /Movimientos/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Movimientos/ })).toHaveClass('focus-visible:ring-3', 'focus-visible:ring-ring/50')
    expect(screen.getByRole('link', { name: /DINADECO/ })).toHaveAttribute('href', '/app/financial/dinadeco')
  })

  it('does not render single-route navigation', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { permissionCodes: ['fin.charges.read'] } } as never)

    const { container } = render(<MemoryRouter><FinancialSectionNav /></MemoryRouter>)

    expect(container).toBeEmptyDOMElement()
  })
})
