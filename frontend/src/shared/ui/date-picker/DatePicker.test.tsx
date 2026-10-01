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

  it('renders a native year dropdown', () => {
    render(<DatePicker value="2026-09-09" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('textbox'))
    expect(screen.getByRole('combobox', { name: 'Año del calendario' })).toHaveValue('2026')
  })

  it('does not accept invalid display dates', () => {
    const onChange = vi.fn()
    render(<DatePicker value="" onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '31/02/2026' } })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('derives year options from min and max', () => {
    render(<DatePicker value="2026-09-15" min="2026-09-10" max="2026-09-20" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('textbox'))
    const yearDropdown = screen.getByRole('combobox', { name: 'Año del calendario' })
    expect(yearDropdown).toHaveTextContent('2026')
    expect(yearDropdown).not.toHaveTextContent('2025')
    expect(yearDropdown).not.toHaveTextContent('2027')
  })

  it('uses a max-relative year range when only a historical maximum is provided', () => {
    render(<DatePicker value="" max="1900-12-31" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('textbox'))
    const yearDropdown = screen.getByRole('combobox', { name: 'Año del calendario' })
    expect(yearDropdown).toHaveValue('1900')
    expect(yearDropdown).toHaveTextContent('1800')
    expect(yearDropdown).toHaveTextContent('1900')
    expect(yearDropdown).not.toHaveTextContent('1901')
  })

  it('keeps previous and next month arrows across December and January', () => {
    render(<DatePicker value="2026-09-09" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('textbox'))
    fireEvent.change(screen.getByRole('combobox', { name: 'Mes del calendario' }), { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Mes siguiente' }))
    expect(screen.getByRole('grid', { name: 'Enero 2027' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Mes anterior' }))
    expect(screen.getByRole('grid', { name: 'Diciembre 2026' })).toBeInTheDocument()
  })

  it('selects a historical month and year directly before choosing a day', () => {
    const onChange = vi.fn()
    render(<DatePicker value="" onChange={onChange} />)

    fireEvent.click(screen.getByRole('textbox'))
    fireEvent.change(screen.getByRole('combobox', { name: 'Mes del calendario' }), { target: { value: '6' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Año del calendario' }), { target: { value: '1981' } })
    expect(screen.getByRole('grid', { name: 'Junio 1981' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar 15/06/1981' }))

    expect(onChange).toHaveBeenCalledWith('1981-06-15')
  })

  it('rejects manual dates outside the configured range', () => {
    const onChange = vi.fn()
    render(<DatePicker value="" min="2026-09-10" max="2026-09-20" onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '21/09/2026' } })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('accepts valid manual DD/MM/AAAA entry', () => {
    const onChange = vi.fn()
    render(<DatePicker value="" onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '15/06/1981' } })
    expect(onChange).toHaveBeenCalledWith('1981-06-15')
  })

  it('blocks future birth dates through a maximum date', () => {
    const onChange = vi.fn()
    render(<DatePicker value="" max="2026-10-01" onChange={onChange} />)

    fireEvent.click(screen.getByRole('textbox'))
    expect(screen.getByRole('combobox', { name: 'Año del calendario' })).not.toHaveTextContent('2027')
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '02/10/2026' } })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
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
