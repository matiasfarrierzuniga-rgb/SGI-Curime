import { describe, expect, it } from 'vitest'
import { getErrorMessage } from './errors'
const error = (status?: number, data?: unknown) => ({ isAxiosError: true, response: status ? { status, data } : undefined })
describe('getErrorMessage', () => { it.each([[400, 'Datos inválidos'], [401, 'sesión ha vencido'], [403, 'No tienes permisos'], [404, 'No se encontró'], [409, 'conflicto'], [500, 'no está disponible']])('maps HTTP %i', (status, expected) => { expect(getErrorMessage(error(status, { message: 'Datos inválidos' }))).toContain(expected) }); it('maps network errors and unknown errors', () => { expect(getErrorMessage(error())).toContain('conectar'); expect(getErrorMessage(new Error())).toBe('Ocurrió un error. Intenta nuevamente.') }) })
