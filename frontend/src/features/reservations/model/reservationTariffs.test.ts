import { RESERVATION_ACTIVITIES, RESERVATION_APPLICANT_CATEGORIES, getReservationTariff as getBackendReservationTariff } from '../../../../../backend/src/reservations/reservation-tariffs'
import { getReservationTariff, reservationActivities, reservationApplicantCategories } from './reservationTariffs'

describe('reservation tariff presentation contract', () => {
  it('keeps labels and displayed tariff amounts aligned with the backend authority', () => {
    expect(reservationActivities.map(activity => activity.value)).toEqual([...RESERVATION_ACTIVITIES])
    expect(reservationApplicantCategories.map(category => category.value)).toEqual([...RESERVATION_APPLICANT_CATEGORIES])

    for (const activity of RESERVATION_ACTIVITIES) {
      for (const category of RESERVATION_APPLICANT_CATEGORIES) {
        expect(getReservationTariff(activity, category)).toBe(getBackendReservationTariff(activity, category))
      }
    }
  })
})
