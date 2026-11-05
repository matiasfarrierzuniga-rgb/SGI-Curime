import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBoundary, getErrorRecoveryPath } from './ErrorBoundary'
function Boom(): never { throw new Error('boom') }
describe('ErrorBoundary', () => {
  it('renders normal children', () => { render(<ErrorBoundary><p>Normal</p></ErrorBoundary>); expect(screen.getByText('Normal')).toBeInTheDocument() })

  it('returns an assembly detail error to the assembly list', () => {
    expect(getErrorRecoveryPath('/app/admin/assemblies/42')).toBe('/app/admin/assemblies')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary pathname="/app/admin/assemblies/42"><Boom /></ErrorBoundary>)
    expect(screen.getByRole('heading')).toHaveTextContent('Algo no salió')
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/app/admin/assemblies')
  })

  it('keeps public errors in public navigation', () => {
    expect(getErrorRecoveryPath('/eventos/7')).toBe('/')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary pathname="/eventos/7"><Boom /></ErrorBoundary>)
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/')
  })

  it('keeps other ERP errors inside the ERP route context', () => {
    expect(getErrorRecoveryPath('/app/dashboard')).toBe('/app/profile')
    expect(getErrorRecoveryPath('/inventory/items')).toBe('/app/profile')
  })
})
