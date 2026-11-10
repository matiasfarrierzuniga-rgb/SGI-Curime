import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { QuickLinksSection } from './QuickLinksSection'

describe('QuickLinksSection', () => {
  it('links the four priority actions to their public destinations', () => {
    render(<MemoryRouter><QuickLinksSection /></MemoryRouter>)

    expect(screen.getByRole('link', { name: /afiliación/i })).toHaveAttribute('href', '/afiliacion')
    expect(screen.getByRole('link', { name: /reservas/i })).toHaveAttribute('href', '/servicios')
    expect(screen.getByRole('link', { name: /eventos/i })).toHaveAttribute('href', '/eventos')
    expect(screen.getByRole('link', { name: /emprendimientos/i })).toHaveAttribute('href', '/ventures')
  })
})
