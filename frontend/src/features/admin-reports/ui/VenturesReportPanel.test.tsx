import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useVentures } from '@/features/entrepreneurship'
import { VenturesReportPanel } from './VenturesReportPanel'

vi.mock('@/features/entrepreneurship', () => ({ useVentures: vi.fn() }))

const venture = {
  id: 8,
  name: 'Café Curime',
  description: 'Café y repostería',
  offerDescription: null,
  businessPhone: null,
  businessEmail: null,
  websiteUrl: null,
  socialUrl: null,
  locationText: 'Curime',
  status: 'ACTIVE' as const,
  publicationStatus: 'PUBLISHED' as const,
  incorporatedAt: '2024-01-10T00:00:00.000Z',
  createdAt: '2024-01-10T00:00:00.000Z',
  updatedAt: '2024-01-10T00:00:00.000Z',
  associations: [{
    id: 5,
    startedAt: '2024-01-10T00:00:00.000Z',
    endedAt: null,
    person: {
      id: 2,
      firstName: 'Ana',
      firstSurname: 'Mora',
      secondSurname: null,
      identification: '1-1111-1111',
      identificationType: 'NATIONAL',
    },
  }],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useVentures).mockReturnValue({
    isPending: false,
    isError: false,
    data: {
      data: [venture],
      total: 1,
      page: 1,
      limit: 20,
      byStatus: [{ status: 'ACTIVE', count: 1 }],
      byLocation: [{ location: 'Curime', count: 1 }],
    },
    refetch: vi.fn(),
  } as never)
})

describe('VenturesReportPanel', () => {
  it('shows registered venture details and its associated person', () => {
    render(<VenturesReportPanel />)

    expect(screen.getByRole('heading', { name: 'Reporte de emprendimientos' })).toBeInTheDocument()
    expect(screen.getByText('Café Curime')).toBeInTheDocument()
    expect(screen.getByText('Ana Mora')).toBeInTheDocument()
    expect(screen.getByText('Curime')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('Activo')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('Publicado')).toBeInTheDocument()
  })

  it('applies supported status, location and incorporation filters to the existing query', async () => {
    render(<VenturesReportPanel />)
    fireEvent.change(screen.getByLabelText('Estado'), {
      target: { value: 'SUSPENDED' },
    })
    fireEvent.change(screen.getByLabelText('Ubicación'), {
      target: { value: '  Curime ' },
    })
    fireEvent.change(screen.getByLabelText('Incorporación desde'), {
      target: { value: '2026-01-01' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    await waitFor(() =>
      expect(useVentures).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: 'SUSPENDED',
          location: 'Curime',
          dateFrom: expect.stringContaining('2026-01-01'),
          page: 1,
          limit: 20,
        }),
      ),
    )
  })
})
