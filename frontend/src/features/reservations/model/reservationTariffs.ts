export const reservationActivities = [
  { value: 'DANCES', label: 'Bailes' },
  { value: 'SPORTS', label: 'Actividades deportivas' },
  { value: 'BINGO', label: 'Bingo' },
  { value: 'TEA_BASKET', label: 'Té de canastilla' },
  { value: 'BIRTHDAY', label: 'Cumpleaños' },
  { value: 'WEDDING', label: 'Boda' },
  { value: 'MOVIE', label: 'Cine' },
  { value: 'MOONLIGHT', label: 'Lunada' },
  { value: 'TALKS', label: 'Charlas' },
] as const

export const reservationApplicantCategories = [
  { value: 'GROUPS_COMMITTEES', label: 'Grupos y comités' },
  { value: 'MEMBERS', label: 'Socios' },
  { value: 'PRIVATE', label: 'Particulares' },
] as const

const tariffs: Record<string, Record<string, number | undefined>> = {
  DANCES: { GROUPS_COMMITTEES: 90000, MEMBERS: 90000, PRIVATE: 90000 },
  SPORTS: { MEMBERS: 10000, PRIVATE: 15000 },
  BINGO: { GROUPS_COMMITTEES: 40000, MEMBERS: 35000, PRIVATE: 50000 },
  TEA_BASKET: { MEMBERS: 35000, PRIVATE: 50000 },
  BIRTHDAY: { MEMBERS: 35000, PRIVATE: 50000 },
  WEDDING: { MEMBERS: 35000, PRIVATE: 50000 },
  MOVIE: { GROUPS_COMMITTEES: 40000, MEMBERS: 10000, PRIVATE: 15000 },
  MOONLIGHT: { GROUPS_COMMITTEES: 40000, MEMBERS: 15000, PRIVATE: 20000 },
  TALKS: { MEMBERS: 0, PRIVATE: 0 },
}

export function getReservationTariff(activity: string, category: string): number | null {
  return tariffs[activity]?.[category] ?? null
}

export function formatReservationTariff(amount: number): string {
  if (amount === 0) return 'Gratis'
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(amount)
}
