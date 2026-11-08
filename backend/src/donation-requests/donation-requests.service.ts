import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DonationRequestStatus, Prisma } from '../../generated/prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDonationRequestDto } from './dto/create-donation-request.dto';
import { QueryDonationRequestsDto } from './dto/query-donation-requests.dto';

const requestSelect = {
  id: true,
  donorName: true,
  email: true,
  phone: true,
  kind: true,
  modality: true,
  paymentPreference: true,
  approximateAmount: true,
  goodsDescription: true,
  comments: true,
  anonymousPublic: true,
  status: true,
  reviewReason: true,
  reviewedById: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DonationRequestSelect;

const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex');

@Injectable()
export class DonationRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateDonationRequestDto, key: string | undefined) {
    if (!key || !/^[A-Za-z0-9_-]{20,128}$/.test(key)) {
      throw new BadRequestException(
        'Se requiere una clave de idempotencia válida.',
      );
    }
    if (!dto.email && !dto.phone)
      throw new BadRequestException('Indique correo o teléfono de contacto.');
    if (dto.kind === 'MONETARY') {
      if (
        !dto.approximateAmount ||
        new Prisma.Decimal(dto.approximateAmount).lte(0) ||
        dto.goodsDescription
      ) {
        throw new BadRequestException(
          'Indique un monto aproximado positivo en CRC.',
        );
      }
      if (
        dto.modality === 'DIGITAL'
          ? !dto.paymentPreference
          : dto.modality !== 'IN_PERSON' || !!dto.paymentPreference
      ) {
        throw new BadRequestException(
          'Seleccione una modalidad monetaria válida.',
        );
      }
    } else if (dto.kind === 'IN_KIND') {
      if (
        !dto.goodsDescription ||
        dto.approximateAmount ||
        dto.paymentPreference ||
        dto.modality === 'DIGITAL'
      ) {
        throw new BadRequestException(
          'Describa los bienes y seleccione entrega presencial o coordinada.',
        );
      }
    }
    const idempotencyHash = digest(key);
    const payloadHash = digest(
      JSON.stringify([
        dto.donorName,
        dto.email ?? null,
        dto.phone ?? null,
        dto.kind,
        dto.modality,
        dto.paymentPreference ?? null,
        dto.approximateAmount ?? null,
        dto.goodsDescription ?? null,
        dto.comments ?? null,
        dto.anonymousPublic,
      ]),
    );
    const existing = await this.prisma.donationRequest.findUnique({
      where: { idempotencyHash },
      select: { id: true, payloadHash: true, status: true },
    });
    if (existing) return this.replay(existing, payloadHash);
    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const request = await tx.donationRequest.create({
          data: {
            donorName: dto.donorName,
            email: dto.email,
            phone: dto.phone,
            kind: dto.kind,
            modality: dto.modality,
            paymentPreference: dto.paymentPreference,
            approximateAmount: dto.approximateAmount,
            goodsDescription: dto.goodsDescription,
            comments: dto.comments,
            anonymousPublic: dto.anonymousPublic,
            idempotencyHash,
            payloadHash,
          },
          select: { id: true, status: true },
        });
        await this.audit.log(
          {
            action: 'DONATION_REQUEST_CREATED',
            module: 'donations',
            entityType: 'DonationRequest',
            entityId: request.id,
          },
          tx,
        );
        return request;
      });
      return created;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const replay = await this.prisma.donationRequest.findUnique({
          where: { idempotencyHash },
          select: { id: true, payloadHash: true, status: true },
        });
        if (replay) return this.replay(replay, payloadHash);
      }
      throw error;
    }
  }

  private replay(
    existing: {
      id: string;
      payloadHash: string;
      status: DonationRequestStatus;
    },
    payloadHash: string,
  ) {
    if (existing.payloadHash !== payloadHash)
      throw new ConflictException(
        'La clave de idempotencia ya se utilizó con otros datos.',
      );
    return { id: existing.id, status: existing.status };
  }

  async findAll(query: QueryDonationRequestsDto) {
    const where = { status: query.status };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.donationRequest.findMany({
        where,
        select: requestSelect,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.donationRequest.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(id: string) {
    const request = await this.prisma.donationRequest.findUnique({
      where: { id },
      select: requestSelect,
    });
    if (!request) throw new NotFoundException('Solicitud no encontrada.');
    return request;
  }

  async transition(
    id: string,
    status: 'IN_REVIEW' | 'REJECTED' | 'CANCELLED',
    actorId: number,
    reason?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const allowed: DonationRequestStatus[] =
        status === 'IN_REVIEW' ? ['PENDING'] : ['PENDING', 'IN_REVIEW'];
      const result = await tx.donationRequest.updateMany({
        where: { id, status: { in: allowed } },
        data: {
          status,
          reviewedById: actorId,
          reviewedAt: new Date(),
          reviewReason: reason ?? null,
        },
      });
      if (result.count !== 1) {
        const exists = await tx.donationRequest.findUnique({
          where: { id },
          select: { id: true },
        });
        if (!exists) throw new NotFoundException('Solicitud no encontrada.');
        throw new ConflictException('La solicitud ya cambió de estado.');
      }
      await this.audit.log(
        {
          userId: actorId,
          action: `DONATION_REQUEST_${status}`,
          module: 'donations',
          entityType: 'DonationRequest',
          entityId: id,
          details: { status },
        },
        tx,
      );
      return tx.donationRequest.findUniqueOrThrow({
        where: { id },
        select: requestSelect,
      });
    });
  }
}
