import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit-actions';
import { AuditService, type AuditContext } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBoardAppointmentDto,
  UpdateBoardAppointmentDto,
} from './dto/board-appointment.dto';
import {
  CreateBoardTermDto,
  UpdateBoardTermDto,
} from './dto/board-term.dto';

const PROFILE_ID = 1;
const personProjection = {
  id: true,
  firstName: true,
  firstSurname: true,
  secondSurname: true,
  legacyFullName: true,
} as const;
const candidateProjection = {
  ...personProjection,
  identificationType: true,
  identification: true,
} as const;
const membershipSelect = {
  id: true,
  termId: true,
  legacyPersonId: true,
  legacyPosition: true,
  seatNumber: true,
  startedAt: true,
  endedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.GovernanceMembershipSelect;

@Injectable()
export class InstitutionalBoardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listTerms() {
    const terms = await this.prisma.governanceTerm.findMany({
      where: { legacyInstitutionalProfileId: PROFILE_ID },
      include: {
        memberships: {
          select: membershipSelect,
          orderBy: [{ startedAt: 'asc' }, { id: 'asc' }],
        },
      },
      orderBy: { startDate: 'desc' },
    });
    return Promise.all(terms.map((term) => this.toLegacyTerm(term)));
  }

  async getTerm(id: number) {
    const term = await this.prisma.governanceTerm.findFirst({
      where: { id, legacyInstitutionalProfileId: PROFILE_ID },
      include: {
        memberships: {
          select: membershipSelect,
          orderBy: [{ startedAt: 'asc' }, { id: 'asc' }],
        },
      },
    });
    if (!term)
      throw new NotFoundException('Período de Junta Directiva no encontrado');
    return this.toLegacyTerm(term);
  }

  createTerm(dto: CreateBoardTermDto, actorId: number, context: AuditContext) {
    this.assertDates(dto.startsOn, dto.endsOn);
    return this.prisma.$transaction(async (tx) => {
      const term = await tx.governanceTerm.create({
        data: {
          legacyInstitutionalProfileId: PROFILE_ID,
          startDate: new Date(dto.startsOn),
          endDate: new Date(dto.endsOn),
        },
      });
      await this.log(
        tx,
        actorId,
        AuditAction.BOARD_TERM_CREATED,
        'BoardTerm',
        term.id,
        ['startsOn', 'endsOn'],
        context,
      );
      return this.toLegacyTermFields(term);
    });
  }

  updateTerm(
    id: number,
    dto: UpdateBoardTermDto,
    actorId: number,
    context: AuditContext,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.governanceTerm.findFirst({
        where: { id, legacyInstitutionalProfileId: PROFILE_ID },
      });
      if (!current)
        throw new NotFoundException('Período de Junta Directiva no encontrado');
      const startsOn = dto.startsOn ? new Date(dto.startsOn) : current.startDate;
      const endsOn = dto.endsOn ? new Date(dto.endsOn) : current.endDate;
      this.assertDates(startsOn, endsOn);
      const appointments = await tx.governanceMembership.findMany({
        where: { termId: id },
        select: { startedAt: true, endedAt: true },
      });
      const candidateTerm = { startsOn, endsOn };
      if (
        appointments.some(
          (appointment) =>
            !this.isAppointmentCompatible(
              candidateTerm,
              appointment.startedAt,
              appointment.endedAt,
            ),
        )
      ) {
        throw new BadRequestException(
          'No se puede modificar el período porque uno o más nombramientos quedarían fuera de su vigencia.',
        );
      }
      const changedFields = Object.keys(dto).filter(
        (key) => dto[key as keyof UpdateBoardTermDto] !== undefined,
      );
      const term = await tx.governanceTerm.update({
        where: { id },
        data: { startDate: startsOn, endDate: endsOn },
      });
      await this.log(
        tx,
        actorId,
        AuditAction.BOARD_TERM_UPDATED,
        'BoardTerm',
        id,
        changedFields,
        context,
      );
      return this.toLegacyTermFields(term);
    });
  }

  createAppointment(
    termId: number,
    dto: CreateBoardAppointmentDto,
    actorId: number,
    context: AuditContext,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const term = await tx.governanceTerm.findFirst({
        where: { id: termId, legacyInstitutionalProfileId: PROFILE_ID },
      });
      if (!term)
        throw new NotFoundException('Período de Junta Directiva no encontrado');
      const person = await this.assertPerson(tx, dto.personId);
      this.assertAppointmentDates(
        { startsOn: term.startDate, endsOn: term.endDate },
        dto.startsOn,
        dto.endsOn,
      );
      const appointment = await tx.governanceMembership.create({
        data: {
          termId,
          legacyPersonId: dto.personId,
          legacyPosition: dto.position,
          seatNumber: dto.seatNumber,
          startedAt: dto.startsOn ? new Date(dto.startsOn) : null,
          endedAt: dto.endsOn ? new Date(dto.endsOn) : null,
        },
        select: membershipSelect,
      });
      await this.log(
        tx,
        actorId,
        AuditAction.BOARD_APPOINTMENT_CREATED,
        'BoardAppointment',
        appointment.id,
        [
          'boardTermId',
          'personId',
          'position',
          ...(['seatNumber', 'startsOn', 'endsOn'] as const).filter(
            (key) => dto[key] != null,
          ),
        ],
        context,
      );
      return this.toLegacyAppointment(appointment, person);
    });
  }

  updateAppointment(
    id: number,
    dto: UpdateBoardAppointmentDto,
    actorId: number,
    context: AuditContext,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.governanceMembership.findUnique({
        where: { id },
        include: { term: true },
      });
      if (
        !current ||
        current.term.legacyInstitutionalProfileId !== PROFILE_ID
      )
        throw new NotFoundException('Nombramiento no encontrado');
      const personId = dto.personId ?? current.legacyPersonId;
      const person = await this.assertPerson(tx, personId);
      const startsOn =
        dto.startsOn === undefined
          ? current.startedAt
          : dto.startsOn
            ? new Date(dto.startsOn)
            : null;
      const endsOn =
        dto.endsOn === undefined
          ? current.endedAt
          : dto.endsOn
            ? new Date(dto.endsOn)
            : null;
      this.assertAppointmentDates(
        { startsOn: current.term.startDate, endsOn: current.term.endDate },
        startsOn,
        endsOn,
      );
      const changedFields = Object.keys(dto).filter(
        (key) => dto[key as keyof UpdateBoardAppointmentDto] !== undefined,
      );
      const appointment = await tx.governanceMembership.update({
        where: { id },
        data: {
          legacyPersonId: dto.personId,
          legacyPosition: dto.position,
          seatNumber: dto.seatNumber,
          startedAt: startsOn,
          endedAt: endsOn,
        },
        select: membershipSelect,
      });
      await this.log(
        tx,
        actorId,
        AuditAction.BOARD_APPOINTMENT_UPDATED,
        'BoardAppointment',
        id,
        changedFields,
        context,
      );
      return this.toLegacyAppointment(appointment, person);
    });
  }

  findPersonCandidates(query: string) {
    return this.prisma.person
      .findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { firstSurname: { contains: query, mode: 'insensitive' } },
            { legacyFullName: { contains: query, mode: 'insensitive' } },
            { identification: { contains: query } },
          ],
        },
        select: candidateProjection,
        take: 10,
        orderBy: { id: 'asc' },
      })
      .then((rows) =>
        rows.map((person) => ({
          id: person.id,
          displayName:
            [person.firstName, person.firstSurname, person.secondSurname]
              .filter(Boolean)
              .join(' ') ||
            person.legacyFullName ||
            `Persona ${person.id}`,
          identificationType: person.identificationType,
          identificationHint: person.identification
            ? `••••${person.identification.slice(-4)}`
            : null,
        })),
      );
  }

  private toLegacyTermFields<T extends { startDate: Date; endDate: Date }>(
    term: T,
  ) {
    const { startDate, endDate, ...rest } = term;
    return { ...rest, startsOn: startDate, endsOn: endDate };
  }

  private async toLegacyTerm<
    T extends {
      startDate: Date;
      endDate: Date;
      memberships: Array<
        Prisma.GovernanceMembershipGetPayload<{
          select: typeof membershipSelect;
        }>
      >;
    },
  >(term: T) {
    const { memberships, ...fields } = term;
    const appointments = await Promise.all(
      memberships.map(async (membership) => {
        const person = await this.prisma.person.findUnique({
          where: { id: membership.legacyPersonId },
          select: personProjection,
        });
        return this.toLegacyAppointment(membership, person);
      }),
    );
    return { ...this.toLegacyTermFields(fields), appointments };
  }

  private toLegacyAppointment<
    T extends {
      termId: number;
      legacyPersonId: number;
      legacyPosition: string;
      startedAt: Date | null;
      endedAt: Date | null;
    },
  >(appointment: T, person: unknown) {
    const {
      termId,
      legacyPersonId,
      legacyPosition,
      startedAt,
      endedAt,
      ...rest
    } = appointment;
    return {
      ...rest,
      boardTermId: termId,
      personId: legacyPersonId,
      position: legacyPosition,
      startsOn: startedAt,
      endsOn: endedAt,
      person,
    };
  }

  private assertDates(start: string | Date, end: string | Date) {
    if (new Date(start) >= new Date(end))
      throw new BadRequestException(
        'La fecha inicial debe ser anterior a la fecha final',
      );
  }

  private assertAppointmentDates(
    term: { startsOn: Date; endsOn: Date },
    start?: string | Date | null,
    end?: string | Date | null,
  ) {
    if (start && end) this.assertDates(start, end);
    if (!this.isAppointmentCompatible(term, start, end))
      throw new BadRequestException(
        'La vigencia del nombramiento no puede quedar completamente fuera del período',
      );
  }

  private isAppointmentCompatible(
    term: { startsOn: Date; endsOn: Date },
    start?: string | Date | null,
    end?: string | Date | null,
  ) {
    const effectiveStart = start ? new Date(start) : term.startsOn;
    const effectiveEnd = end ? new Date(end) : term.endsOn;
    return (
      effectiveStart <= effectiveEnd &&
      effectiveStart <= term.endsOn &&
      effectiveEnd >= term.startsOn
    );
  }

  private async assertPerson(tx: Prisma.TransactionClient, id: number) {
    const person = await tx.person.findUnique({
      where: { id },
      select: personProjection,
    });
    if (!person) throw new NotFoundException('Persona no encontrada');
    return person;
  }

  private log(
    tx: Prisma.TransactionClient,
    userId: number,
    action: AuditAction,
    entityType: string,
    entityId: number,
    changedFields: readonly string[],
    context: AuditContext,
  ) {
    return this.audit.log(
      {
        userId,
        action,
        module: 'INSTITUTIONAL_BOARD',
        entityType,
        entityId,
        details: { changedFields },
        ...context,
      },
      tx,
    );
  }
}
