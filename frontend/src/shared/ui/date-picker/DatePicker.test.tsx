import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DatePicker } from './DatePicker'

describe('DatePicker', () => {
  afterEach(() => vi.useRealTimers())

  it('renders an empty value and displays canonical dates in DD/MM/AAAA', () => {
    const { rerender } = render(<DatePicker value="" onChange={vi.fn()} />)
    expect(screen.getByRole('textbox')).toHaveValue('')

    rerender(<DatePicker value="2026-09-09" onChange={vi.fn()} />)
    expect(screen.getByRole('textbox')).toHaveValue('09/09/2026')
  })

  it('returns YYYY-MM-DD when selecting a day', () => {
    const onChange = vi.fn()
    render(<DatePicker value="2026-09-09" onChange={onChange} />)

    fireEvent.click(screen.getByRole('textbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar 10/09/2026' }))
    expect(onChange).toHaveBeenCalledWith('2026-09-10')
  })

  it('does not accept invalid display dates', () => {
    const onChange = vi.fn()
    render(<DatePicker value="" onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '31/02/2026' } })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('disables days outside min and max', () => {
    render(<DatePicker value="2026-09-15" min="2026-09-10" max="2026-09-20" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('textbox'))
    expect(screen.getByRole('button', { name: 'Seleccionar 09/09/2026' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Seleccionar 21/09/2026' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Seleccionar 15/09/2026' })).not.toBeDisabled()
  })

  it('navigates between months', () => {
    render(<DatePicker value="2026-09-09" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('textbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Mes siguiente' }))
    expect(screen.getByRole('grid', { name: 'Octubre 2026' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Mes anterior' }))
    expect(screen.getByRole('grid', { name: 'Septiembre 2026' })).toBeInTheDocument()
  })

  it('closes on Escape and restores focus to the input', () => {
    render(<DatePicker value="2026-09-09" onChange={vi.fn()} />)
    const input = screen.getByRole('textbox')

    input.focus()
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('dialog', { name: 'Calendario' })).not.toBeInTheDocument()
    expect(document.activeElement).toBe(input)
  })

  it('closes when clicking outside', () => {
    render(<><DatePicker value="2026-09-09" onChange={vi.fn()} /><button type="button">Fuera</button></>)

    fireEvent.click(screen.getByRole('textbox'))
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Fuera' }))
    expect(screen.queryByRole('dialog', { name: 'Calendario' })).not.toBeInTheDocument()
  })

  it('prevents interaction when disabled', () => {
    render(<DatePicker value="2026-09-09" disabled onChange={vi.fn()} />)

    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
    fireEvent.click(input)
    expect(screen.queryByRole('dialog', { name: 'Calendario' })).not.toBeInTheDocument()
  })

  it('marks the selected day', () => {
    render(<DatePicker value="2026-09-09" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('textbox'))
    expect(screen.getByRole('button', { name: 'Seleccionar 09/09/2026' })).toHaveAttribute('aria-pressed', 'true')
  })
})
