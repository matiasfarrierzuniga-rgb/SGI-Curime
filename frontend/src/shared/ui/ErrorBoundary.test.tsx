import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'
function Boom(): never { throw new Error('boom') }
describe('ErrorBoundary', () => { it('renders normal children', () => { render(<ErrorBoundary><p>Normal</p></ErrorBoundary>); expect(screen.getByText('Normal')).toBeInTheDocument() }); it('shows recovery fallback after a child error', () => { vi.spyOn(console, 'error').mockImplementation(() => {}); render(<ErrorBoundary><Boom/></ErrorBoundary>); expect(screen.getByRole('heading')).toHaveTextContent('Algo no salió'); expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/profile') }) })
