import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { QuickLinksSection } from './QuickLinksSection'

describe('QuickLinksSection', () => {
  it('links volunteering to its public opportunities directory', () => {
    render(<MemoryRouter><QuickLinksSection /></MemoryRouter>)

    expect(screen.getByRole('link', { name: /voluntariado/i })).toHaveAttribute('href', '/voluntariado')
  })
})
