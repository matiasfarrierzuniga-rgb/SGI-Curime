import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FormField } from './FormField'
import { Input } from './input'
import { Select } from './select'

describe('FormField', () => {
  it('associates label, description, error and required state with its control', () => {
    render(
      <FormField id="institutional-email" label="Correo institucional" description="Use el correo oficial." error="Ingrese un correo válido." required>
        <Input type="email" />
      </FormField>,
    )

    const input = screen.getByRole('textbox', { name: 'Correo institucional(requerido)' })

    expect(input).toHaveAttribute('id', 'institutional-email')
    expect(input).toHaveAttribute('aria-describedby', 'institutional-email-description institutional-email-error')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-required', 'true')
    expect(input).toBeRequired()
    expect(input).toHaveAccessibleDescription('Use el correo oficial. Ingrese un correo válido.')
  })

  it('keeps select accessible and focusable with shared control sizing', () => {
    render(
      <FormField id="organization-type" label="Tipo de asociación">
        <Select defaultValue="INTEGRAL">
          <option value="INTEGRAL">Integral</option>
          <option value="SPECIFIC">Específica</option>
        </Select>
      </FormField>,
    )

    const select = screen.getByRole('combobox', { name: 'Tipo de asociación' })
    select.focus()

    expect(select).toHaveFocus()
    expect(select).toHaveClass('h-(--size-control)', 'focus-visible:ring-3')
    expect(select).not.toBeDisabled()
  })

  it('preserves invalid and disabled semantic states', () => {
    render(
      <FormField id="legal-name" label="Nombre legal">
        <Input aria-invalid="true" disabled />
      </FormField>,
    )

    const input = screen.getByRole('textbox', { name: 'Nombre legal' })

    expect(input).toBeDisabled()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveClass('h-(--size-control)', 'aria-invalid:ring-3')
  })
})
