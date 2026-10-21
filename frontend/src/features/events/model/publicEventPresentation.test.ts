import { describe, expect, it } from 'vitest'
import { getPublicEventPresentation } from './publicEventPresentation'

describe('getPublicEventPresentation', () => {
  const now = new Date('2030-01-10T12:00:00.000Z').getTime()

  it('keeps future scheduled events as programmed', () => {
    expect(getPublicEventPresentation({ status: 'SCHEDULED', startAt: '2030-01-11T12:00:00.000Z', endAt: null }, now)).toMatchObject({ label: 'Programado', isPast: false })
  })

  it('keeps scheduled events ongoing through their end date as programmed', () => {
    expect(getPublicEventPresentation({ status: 'SCHEDULED', startAt: '2030-01-10T10:00:00.000Z', endAt: '2030-01-10T14:00:00.000Z' }, now)).toMatchObject({ label: 'Programado', isPast: false })
  })

  it('labels elapsed scheduled events without changing backend status', () => {
    expect(getPublicEventPresentation({ status: 'SCHEDULED', startAt: '2030-01-09T10:00:00.000Z', endAt: '2030-01-09T14:00:00.000Z' }, now)).toEqual({ label: 'Fecha transcurrida', isPast: true, backendStatus: 'SCHEDULED' })
  })

  it('labels completed events as activities carried out', () => {
    expect(getPublicEventPresentation({ status: 'COMPLETED', startAt: '2030-01-11T12:00:00.000Z', endAt: null }, now)).toMatchObject({ label: 'Actividad realizada', isPast: true })
  })

  it('preserves cancelled backend status', () => {
    expect(getPublicEventPresentation({ status: 'CANCELLED', startAt: '2030-01-11T12:00:00.000Z', endAt: null }, now)).toMatchObject({ label: 'Cancelado', isPast: false })
  })
})
