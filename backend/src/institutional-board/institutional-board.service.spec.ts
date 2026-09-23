import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BoardPosition } from '../../generated/prisma/enums';
import { InstitutionalBoardService } from './institutional-board.service';
describe('InstitutionalBoardService', () => {
  const tx = { boardTerm: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() }, boardAppointment: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() }, person: { findUnique: jest.fn() }, auditLog: { create: jest.fn() } };
  const prisma = { boardTerm: { findMany: jest.fn(), findFirst: jest.fn() }, person: { findMany: jest.fn() }, $transaction: jest.fn((cb: (client: typeof tx) => unknown) => cb(tx)) };
  const audit = { log: jest.fn().mockResolvedValue({}) };
  const service = new InstitutionalBoardService(prisma as never, audit as never);
  beforeEach(() => jest.clearAllMocks());
  it('creates a term and audit atomically', async () => { tx.boardTerm.create.mockResolvedValue({ id: 4 }); await service.createTerm({ startsOn: '2026-01-01', endsOn: '2027-12-31' }, 2, {}); expect(tx.boardTerm.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ institutionalProfileId: 1 }) })); expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'BOARD_TERM_CREATED', details: { changedFields: ['startsOn','endsOn'] } }), tx); });
  it('rejects an inverted term', () => expect(() => service.createTerm({ startsOn: '2027-01-01', endsOn: '2026-01-01' }, 2, {})).toThrow(BadRequestException));
  it('rejects a term update that would leave an appointment completely outside without writing or auditing', async () => {
    tx.boardTerm.findFirst.mockResolvedValue({ id: 4, startsOn: new Date('2026-01-01'), endsOn: new Date('2028-12-31') });
    tx.boardAppointment.findMany.mockResolvedValue([{ startsOn: new Date('2027-01-01'), endsOn: new Date('2027-12-31') }]);
    await expect(service.updateTerm(4, { endsOn: '2026-12-31' }, 2, {})).rejects.toThrow('No se puede modificar el período porque uno o más nombramientos quedarían fuera de su vigencia.');
    expect(tx.boardTerm.update).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });
  it('allows a term update when an appointment partially intersects the candidate dates', async () => {
    tx.boardTerm.findFirst.mockResolvedValue({ id: 4, startsOn: new Date('2026-01-01'), endsOn: new Date('2028-12-31') });
    tx.boardAppointment.findMany.mockResolvedValue([{ startsOn: new Date('2025-12-01'), endsOn: new Date('2026-02-01') }]);
    tx.boardTerm.update.mockResolvedValue({ id: 4 });
    await expect(service.updateTerm(4, { endsOn: '2026-12-31' }, 2, {})).resolves.toEqual({ id: 4 });
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'BOARD_TERM_UPDATED' }), tx);
  });
  it.each([
    [{ startsOn: null, endsOn: new Date('2026-06-30') }],
    [{ startsOn: new Date('2026-06-01'), endsOn: null }],
    [{ startsOn: null, endsOn: null }],
  ])('recalculates nullable appointment overrides against candidate term dates', async appointmentDates => {
    tx.boardTerm.findFirst.mockResolvedValue({ id: 4, startsOn: new Date('2025-01-01'), endsOn: new Date('2028-12-31') });
    tx.boardAppointment.findMany.mockResolvedValue([appointmentDates]);
    tx.boardTerm.update.mockResolvedValue({ id: 4 });
    await expect(service.updateTerm(4, { startsOn: '2026-01-01', endsOn: '2026-12-31' }, 2, {})).resolves.toEqual({ id: 4 });
  });
  it('updates and audits normally when the term has no appointments', async () => {
    tx.boardTerm.findFirst.mockResolvedValue({ id: 4, startsOn: new Date('2026-01-01'), endsOn: new Date('2028-12-31') });
    tx.boardAppointment.findMany.mockResolvedValue([]);
    tx.boardTerm.update.mockResolvedValue({ id: 4 });
    await service.updateTerm(4, { endsOn: '2027-12-31' }, 2, {});
    expect(tx.boardTerm.update).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'BOARD_TERM_UPDATED' }), tx);
  });
  it('keeps null overrides and allows a person without User or Affiliate', async () => { tx.boardTerm.findFirst.mockResolvedValue({ id: 4, startsOn: new Date('2026-01-01'), endsOn: new Date('2027-12-31') }); tx.person.findUnique.mockResolvedValue({ id: 9 }); tx.boardAppointment.create.mockResolvedValue({ id: 3 }); await service.createAppointment(4, { personId: 9, position: BoardPosition.TREASURER, startsOn: null, endsOn: null }, 2, {}); expect(tx.boardAppointment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ personId: 9, startsOn: null, endsOn: null }) })); });
  it('rejects a missing person', async () => { tx.boardTerm.findFirst.mockResolvedValue({ id: 4, startsOn: new Date('2026-01-01'), endsOn: new Date('2027-12-31') }); tx.person.findUnique.mockResolvedValue(null); await expect(service.createAppointment(4, { personId: 999, position: BoardPosition.PRESIDENT }, 2, {})).rejects.toThrow(NotFoundException); });
  it('rejects fully outside dates and permits partial intersection', async () => { tx.boardTerm.findFirst.mockResolvedValue({ id: 4, startsOn: new Date('2026-01-01'), endsOn: new Date('2026-12-31') }); tx.person.findUnique.mockResolvedValue({ id: 9 }); tx.boardAppointment.create.mockResolvedValue({ id: 3 }); await expect(service.createAppointment(4, { personId: 9, position: BoardPosition.VOCAL, startsOn: '2027-01-01' }, 2, {})).rejects.toThrow(BadRequestException); await expect(service.createAppointment(4, { personId: 9, position: BoardPosition.VOCAL, startsOn: '2025-12-01', endsOn: '2026-02-01' }, 2, {})).resolves.toEqual({ id: 3 }); });
  it('minimizes candidate PII', async () => { prisma.person.findMany.mockResolvedValue([{ id: 9, firstName: 'Persona', firstSurname: 'Ejemplo', secondSurname: null, legacyFullName: null, identificationType: 'NATIONAL', identification: '123456789' }]); await expect(service.findPersonCandidates('Persona')).resolves.toEqual([{ id: 9, displayName: 'Persona Ejemplo', identificationType: 'NATIONAL', identificationHint: '••••6789' }]); });
});
