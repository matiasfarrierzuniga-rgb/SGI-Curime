import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventMutations } from '../hooks/useEventsQueries'
import { EventForm } from './EventForm'

vi.mock('../hooks/useEventsQueries', () => ({ useEventMutations: vi.fn() }))

describe('EventForm', () => {
  beforeEach(() => {
    vi.mocked(useEventMutations).mockReturnValue({
      create: { isPending: false, mutateAsync: vi.fn() },
      update: { isPending: false, mutateAsync: vi.fn() },
      publish: { isPending: false, mutateAsync: vi.fn() },
      archive: { isPending: false, mutateAsync: vi.fn() },
    } as never)
  })

  it('keeps submit disabled until required fields are valid', () => {
    render(<EventForm onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Guardar evento' })).toBeDisabled()
  })

  it('shows inline error when end date precedes start date', () => {
    render(<EventForm onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Actividad' } })
    fireEvent.change(screen.getByLabelText('Resumen'), { target: { value: 'Información confirmada.' } })
    fireEvent.change(screen.getByLabelText('Fecha y hora de inicio'), { target: { value: '2030-01-02T10:00' } })
    fireEvent.change(screen.getByLabelText('Fecha y hora de finalización'), { target: { value: '2030-01-02T09:00' } })

    expect(screen.getByText('La fecha final debe ser posterior a la inicial.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar evento' })).toBeDisabled()
  })
})
