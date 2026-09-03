import { fireEvent, render, screen } from '@testing-library/react'
import { Link, MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PublicScrollRestoration } from './PublicScrollRestoration'

const scrollTo = vi.fn()
const scrollIntoView = vi.fn()

function ScrollLayout() {
  return <><PublicScrollRestoration /><Outlet /></>
}

describe('PublicScrollRestoration', () => {
  beforeEach(() => {
    scrollTo.mockClear()
    scrollIntoView.mockClear()
    vi.stubGlobal('scrollTo', scrollTo)
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
  })

  it('moves new route navigation to the top', () => {
    render(
      <MemoryRouter initialEntries={['/inicio']}>
        <Routes>
          <Route element={<ScrollLayout />}>
            <Route path="/inicio" element={<Link to="/destino">Siguiente</Link>} />
            <Route path="/destino" element={<p>Destino</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Siguiente' }))

    expect(screen.getByText('Destino')).toBeInTheDocument()
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' })
  })

  it('leaves history navigation to the browser restoration policy', () => {
    render(
      <MemoryRouter initialEntries={['/inicio', '/destino']} initialIndex={1}>
        <Routes>
          <Route element={<ScrollLayout />}>
            <Route path="/inicio" element={<p>Inicio</p>} />
            <Route path="/destino" element={<p>Destino</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('scrolls to hash targets instead of resetting their route', () => {
    render(
      <MemoryRouter initialEntries={['/detalles#informacion']}>
        <Routes>
          <Route element={<ScrollLayout />}>
            <Route path="/detalles" element={<section id="informacion">Información</section>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' })
    expect(scrollTo).not.toHaveBeenCalled()
  })
})
