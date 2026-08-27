import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AccessLayout } from './AccessLayout'

describe('AccessLayout', () => {
  it.each(['/login', '/register', '/forgot-password', '/reset-password', '/activate-account'])('provides a public-site return action on %s', (path) => {
    render(<MemoryRouter initialEntries={[path]}><Routes><Route element={<AccessLayout />}><Route path={path} element={<main><h1>Pantalla de acceso</h1></main>} /></Route></Routes></MemoryRouter>)

    expect(screen.getByRole('link', { name: 'Volver al sitio' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'ADI Curime, inicio' })).toHaveAttribute('href', '/')
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })
})
