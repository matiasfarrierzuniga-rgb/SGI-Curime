import { fireEvent, render, screen } from '@testing-library/react'
import type { FormEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { FormField } from './FormField'
import { SearchFilterBar, SearchInput } from './SearchFilterBar'

describe('SearchFilterBar', () => {
  it('separates decorative icon and input into dedicated grid regions', () => {
    render(
      <SearchFilterBar label="Buscar personas" role="search">
        <FormField id="person-search" label="Búsqueda">
          <SearchInput placeholder="Nombre o correo" />
        </FormField>
      </SearchFilterBar>,
    )

    const input = screen.getByRole('searchbox', { name: 'Búsqueda' })

    expect(screen.getByRole('search', { name: 'Buscar personas' })).toBeInTheDocument()
    const control = input.parentElement
    const iconRegion = control?.querySelector('[aria-hidden="true"]')

    expect(control).toHaveClass('grid-cols-[2.5rem_minmax(0,1fr)]')
    expect(iconRegion).toHaveAttribute('aria-hidden', 'true')
    expect(iconRegion).toHaveClass('pointer-events-none')
    expect(input).toHaveClass('px-0')
    expect(input).not.toHaveAttribute('data-leading-icon')
  })

  it('preserves native submit behavior for a composed filter form', () => {
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault())

    render(
      <SearchFilterBar label="Buscar personas" role="search" onSubmit={onSubmit}>
        <FormField id="person-search" label="Búsqueda">
          <SearchInput />
        </FormField>
      </SearchFilterBar>,
    )

    fireEvent.submit(screen.getByRole('search', { name: 'Buscar personas' }))

    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('preserves disabled and invalid state on native search input', () => {
    render(
      <SearchFilterBar label="Buscar personas" role="search">
        <FormField id="person-search" label="Búsqueda" error="Error de búsqueda">
          <SearchInput disabled />
        </FormField>
      </SearchFilterBar>,
    )

    const input = screen.getByRole('searchbox', { name: 'Búsqueda' })

    expect(input).toBeDisabled()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input.parentElement).toHaveAttribute('data-invalid', 'true')
  })
})
