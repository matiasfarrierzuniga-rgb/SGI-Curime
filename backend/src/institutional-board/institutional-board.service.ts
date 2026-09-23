import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit-actions';
import { AuditService, type AuditContext } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardAppointmentDto, UpdateBoardAppointmentDto } from './dto/board-appointment.dto';
import { CreateBoardTermDto, UpdateBoardTermDto } from './dto/board-term.dto';

const PROFILE_ID = 1;
const personProjection = { id: true, firstName: true, firstSurname: true, secondSurname: true, legacyFullName: true } as const;
const candidateProjection = { ...personProjection, identificationType: true, identification: true } as const;
const termInclude = { appointments: { include: { person: { select: personProjection } }, orderBy: [{ startsOn: 'asc' as const }, { id: 'asc' as const }] } };

@Injectable()
export class InstitutionalBoardService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  listTerms() { return this.prisma.boardTerm.findMany({ where: { institutionalProfileId: PROFILE_ID }, include: termInclude, orderBy: { startsOn: 'desc' } }); }
  async getTerm(id: number) {
    const term = await this.prisma.boardTerm.findFirst({ where: { id, institutionalProfileId: PROFILE_ID }, include: termInclude });
    if (!term) throw new NotFoundException('Período de Junta Directiva no encontrado');
    return term;
  }
  createTerm(dto: CreateBoardTermDto, actorId: number, context: AuditContext) {
    this.assertDates(dto.startsOn, dto.endsOn);
    return this.prisma.$transaction(async tx => {
      const term = await tx.boardTerm.create({ data: { institutionalProfileId: PROFILE_ID, startsOn: new Date(dto.startsOn), endsOn: new Date(dto.endsOn) } });
      await this.log(tx, actorId, AuditAction.BOARD_TERM_CREATED, 'BoardTerm', term.id, ['startsOn', 'endsOn'], context);
      return term;
    });
  }
  updateTerm(id: number, dto: UpdateBoardTermDto, actorId: number, context: AuditContext) {
    return this.prisma.$transaction(async tx => {
      const current = await tx.boardTerm.findFirst({ where: { id, institutionalProfileId: PROFILE_ID } });
      if (!current) throw new NotFoundException('Período de Junta Directiva no encontrado');
      const startsOn = dto.startsOn ? new Date(dto.startsOn) : current.startsOn;
      const endsOn = dto.endsOn ? new Date(dto.endsOn) : current.endsOn;
      this.assertDates(startsOn, endsOn);
      const appointments = await tx.boardAppointment.findMany({
        where: { boardTermId: id },
        select: { startsOn: true, endsOn: true },
      });
      const candidateTerm = { startsOn, endsOn };
      if (appointments.some(appointment => !this.isAppointmentCompatible(candidateTerm, appointment.startsOn, appointment.endsOn))) {
        throw new BadRequestException('No se puede modificar el período porque uno o más nombramientos quedarían fuera de su vigencia.');
      }
      const changedFields = Object.keys(dto).filter(k => dto[k as keyof UpdateBoardTermDto] !== undefined);
      const term = await tx.boardTerm.update({ where: { id }, data: { startsOn, endsOn } });
      await this.log(tx, actorId, AuditAction.BOARD_TERM_UPDATED, 'BoardTerm', id, changedFields, context);
      return term;
    });
  }
  createAppointment(termId: number, dto: CreateBoardAppointmentDto, actorId: number, context: AuditContext) {
    return this.prisma.$transaction(async tx => {
      const term = await tx.boardTerm.findFirst({ where: { id: termId, institutionalProfileId: PROFILE_ID } });
      if (!term) throw new NotFoundException('Período de Junta Directiva no encontrado');
      await this.assertPerson(tx, dto.personId);
      this.assertAppointmentDates(term, dto.startsOn, dto.endsOn);
      const appointment = await tx.boardAppointment.create({ data: { boardTermId: termId, personId: dto.personId, position: dto.position, seatNumber: dto.seatNumber, startsOn: dto.startsOn ? new Date(dto.startsOn) : null, endsOn: dto.endsOn ? new Date(dto.endsOn) : null }, include: { person: { select: personProjection } } });
      await this.log(tx, actorId, AuditAction.BOARD_APPOINTMENT_CREATED, 'BoardAppointment', appointment.id, ['boardTermId', 'personId', 'position', ...(['seatNumber', 'startsOn', 'endsOn'] as const).filter(k => dto[k] != null)], context);
      return appointment;
    });
  }
  updateAppointment(id: number, dto: UpdateBoardAppointmentDto, actorId: number, context: AuditContext) {
    return this.prisma.$transaction(async tx => {
      const current = await tx.boardAppointment.findUnique({ where: { id }, include: { boardTerm: true } });
      if (!current || current.boardTerm.institutionalProfileId !== PROFILE_ID) throw new NotFoundException('Nombramiento no encontrado');
      if (dto.personId !== undefined) await this.assertPerson(tx, dto.personId);
      const startsOn = dto.startsOn === undefined ? current.startsOn : dto.startsOn ? new Date(dto.startsOn) : null;
      const endsOn = dto.endsOn === undefined ? current.endsOn : dto.endsOn ? new Date(dto.endsOn) : null;
      this.assertAppointmentDates(current.boardTerm, startsOn, endsOn);
      const changedFields = Object.keys(dto).filter(k => dto[k as keyof UpdateBoardAppointmentDto] !== undefined);
      const appointment = await tx.boardAppointment.update({ where: { id }, data: { ...dto, startsOn, endsOn }, include: { person: { select: personProjection } } });
      await this.log(tx, actorId, AuditAction.BOARD_APPOINTMENT_UPDATED, 'BoardAppointment', id, changedFields, context);
      return appointment;
    });
  }
  findPersonCandidates(query: string) {
    return this.prisma.person.findMany({ where: { OR: [{ firstName: { contains: query, mode: 'insensitive' } }, { firstSurname: { contains: query, mode: 'insensitive' } }, { legacyFullName: { contains: query, mode: 'insensitive' } }, { identification: { contains: query } }] }, select: candidateProjection, take: 10, orderBy: { id: 'asc' } }).then(rows => rows.map(p => ({ id: p.id, displayName: [p.firstName, p.firstSurname, p.secondSurname].filter(Boolean).join(' ') || p.legacyFullName || `Persona ${p.id}`, identificationType: p.identificationType, identificationHint: p.identification ? `••••${p.identification.slice(-4)}` : null })));
  }
  private assertDates(start: string | Date, end: string | Date) { if (new Date(start) > new Date(end)) throw new BadRequestException('La fecha inicial no puede ser posterior a la fecha final'); }
  private assertAppointmentDates(term: { startsOn: Date; endsOn: Date }, start?: string | Date | null, end?: string | Date | null) {
    if (start && end) this.assertDates(start, end);
    if (!this.isAppointmentCompatible(term, start, end)) throw new BadRequestException('La vigencia del nombramiento no puede quedar completamente fuera del período');
  }
  private isAppointmentCompatible(term: { startsOn: Date; endsOn: Date }, start?: string | Date | null, end?: string | Date | null) {
    const effectiveStart = start ? new Date(start) : term.startsOn;
    const effectiveEnd = end ? new Date(end) : term.endsOn;
    return effectiveStart <= effectiveEnd && effectiveStart <= term.endsOn && effectiveEnd >= term.startsOn;
  }
  private async assertPerson(tx: Prisma.TransactionClient, id: number) { if (!await tx.person.findUnique({ where: { id }, select: { id: true } })) throw new NotFoundException('Persona no encontrada'); }
  private log(tx: Prisma.TransactionClient, userId: number, action: AuditAction, entityType: string, entityId: number, changedFields: readonly string[], context: AuditContext) { return this.audit.log({ userId, action, module: 'INSTITUTIONAL_BOARD', entityType, entityId, details: { changedFields }, ...context }, tx); }
}
