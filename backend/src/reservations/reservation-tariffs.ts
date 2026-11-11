export const RESERVATION_ACTIVITIES = [
  'DANCES',
  'SPORTS',
  'BINGO',
  'TEA_BASKET',
  'BIRTHDAY',
  'WEDDING',
  'MOVIE',
  'MOONLIGHT',
  'TALKS',
] as const

export const RESERVATION_APPLICANT_CATEGORIES = [
  'GROUPS_COMMITTEES',
  'MEMBERS',
  'PRIVATE',
] as const

export type ReservationActivity = (typeof RESERVATION_ACTIVITIES)[number]
export type ReservationApplicantCategory = (typeof RESERVATION_APPLICANT_CATEGORIES)[number]

const tariffs: Record<ReservationActivity, Partial<Record<ReservationApplicantCategory, number>>> = {
  DANCES: { GROUPS_COMMITTEES: 90000, MEMBERS: 90000, PRIVATE: 90000 },
  SPORTS: {},
  BINGO: { GROUPS_COMMITTEES: 40000, MEMBERS: 35000, PRIVATE: 50000 },
  TEA_BASKET: { MEMBERS: 35000, PRIVATE: 50000 },
  BIRTHDAY: { MEMBERS: 35000, PRIVATE: 50000 },
  WEDDING: { MEMBERS: 35000, PRIVATE: 50000 },
  MOVIE: { GROUPS_COMMITTEES: 40000 },
  MOONLIGHT: { GROUPS_COMMITTEES: 40000 },
  TALKS: {},
}

export function getReservationTariff(activity: string, applicantCategory: string): number | null {
  if (!RESERVATION_ACTIVITIES.includes(activity as ReservationActivity)) return null
  if (!RESERVATION_APPLICANT_CATEGORIES.includes(applicantCategory as ReservationApplicantCategory)) return null
  return tariffs[activity as ReservationActivity][applicantCategory as ReservationApplicantCategory] ?? null
}