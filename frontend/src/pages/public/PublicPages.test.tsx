import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { PublicLayout } from '@/app/layouts/PublicLayout'
import { ContactPage, EventsPage, HomePage, NewsPage, ServicesPage } from './PublicPages'

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false }),
}))

function renderPublic(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/servicios" element={<ServicesPage />} />
            <Route path="/contacto" element={<ContactPage />} />
            <Route path="/noticias" element={<NewsPage />} />
            <Route path="/eventos" element={<EventsPage />} />
          </Route>
          <Route path="/login" element={<p>Login</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('portal público', () => {
  it('muestra la landing y navega al inicio de sesión', () => {
    const { container } = renderPublic()
    expect(container.querySelector('h1')).toHaveTextContent(/asociación de desarrollo integral/i)

    const loginLink = container.querySelector<HTMLAnchorElement>('a[href="/login"]')
    expect(loginLink).not.toBeNull()
    fireEvent.click(loginLink!)

    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('abre y cierra el menú móvil con Escape', () => {
    renderPublic()
    fireEvent.click(screen.getByRole('button', { name: /abrir menú/i }))
    expect(screen.getByRole('navigation', { name: /navegación pública/i })).toHaveClass('is-open')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByRole('navigation', { name: /navegación pública/i })).not.toHaveClass('is-open')
  })

  it.each([
    ['/servicios', /servicios/i],
    ['/contacto', /contacto/i],
    ['/noticias', /noticias/i],
    ['/eventos', /eventos/i],
  ])('muestra %s', (path: string, heading: RegExp) => {
    renderPublic(path)
    expect(screen.getByRole('heading', { name: heading, level: 1 })).toBeInTheDocument()
  })
})
