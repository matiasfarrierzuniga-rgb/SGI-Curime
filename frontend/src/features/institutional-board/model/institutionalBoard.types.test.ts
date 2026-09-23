import { describe, expect, it } from 'vitest'
import { BOARD_POSITIONS, BOARD_POSITION_LABELS } from './institutionalBoard.types'
describe('institutional board contract', () => {
  it('exposes only documented positions with Spanish labels', () => {
    expect(BOARD_POSITIONS).toEqual(['PRESIDENT','VICE_PRESIDENT','SECRETARY','TREASURER','VOCAL','FISCAL','SUPLENTE'])
    expect(BOARD_POSITION_LABELS.TREASURER).toBe('Tesorería')
  })
})
