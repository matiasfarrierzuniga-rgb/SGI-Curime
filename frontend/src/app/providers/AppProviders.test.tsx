import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { RoutedErrorBoundary } from './AppProviders'

function Boom(): never { throw new Error('boom') }

describe('RoutedErrorBoundary', () => {
  it('uses the active ERP route when selecting recovery destination', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<MemoryRouter initialEntries={['/app/admin/assemblies/42']}><Routes><Route path="/app/admin/assemblies/:id" element={<RoutedErrorBoundary><Boom /></RoutedErrorBoundary>} /></Routes></MemoryRouter>)

    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/app/admin/assemblies')
  })
})
