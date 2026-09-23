export const BOARD_POSITIONS = ['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER', 'VOCAL', 'FISCAL', 'SUPLENTE'] as const
export type BoardPosition = typeof BOARD_POSITIONS[number]
export const BOARD_POSITION_LABELS: Record<BoardPosition, string> = { PRESIDENT: 'Presidencia', VICE_PRESIDENT: 'Vicepresidencia', SECRETARY: 'Secretaría', TREASURER: 'Tesorería', VOCAL: 'Vocalía', FISCAL: 'Fiscalía', SUPLENTE: 'Suplencia' }
export type PersonSummary = { id: number; firstName: string | null; firstSurname: string | null; secondSurname: string | null; legacyFullName: string | null }
export type BoardAppointment = { id: number; boardTermId: number; personId: number; position: BoardPosition; seatNumber: number | null; startsOn: string | null; endsOn: string | null; person: PersonSummary }
export type BoardTerm = { id: number; startsOn: string; endsOn: string; appointments: BoardAppointment[] }
export type PersonCandidate = { id: number; displayName: string; identificationType: string | null; identificationHint: string | null }
