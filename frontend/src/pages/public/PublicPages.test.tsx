import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../../auth/AuthContext'
import { PublicLayout } from '../../layouts/PublicLayout'
import { ContactPage, EventsPage, HomePage, NewsPage, ServicesPage } from './PublicPages'

function renderPublic(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
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
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('portal público', () => {
  it('muestra la landing y navega al inicio de sesión', async () => {
    renderPublic()
    expect(screen.getByRole('heading', { name: /asociación de desarrollo integral/i })).toBeInTheDocument()

    const loginLink = screen
      .getAllByRole('link', { name: /acceder al sgi/i })
      .find(link => link.getAttribute('href') === '/login')

    expect(loginLink).toBeDefined()
    fireEvent.click(loginLink!)

    expect(await screen.findByText('Login')).toBeInTheDocument()
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
