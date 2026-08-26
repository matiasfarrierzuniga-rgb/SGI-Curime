import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AccessLayout } from './AccessLayout'

describe('AccessLayout', () => {
  it('renders access content without adding another main landmark', () => {
    render(<MemoryRouter initialEntries={['/login']}><Routes><Route element={<AccessLayout />}><Route path="/login" element={<main><h1>Iniciar sesión</h1></main>} /></Route></Routes></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })
})
