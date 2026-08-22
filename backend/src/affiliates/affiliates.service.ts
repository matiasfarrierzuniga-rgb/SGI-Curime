import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  isValidIdentification,
  isValidPhone,
} from '../common/validation/identity-contact.validation';
import { AffiliateStatus, Prisma } from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAffiliatesDto } from './dto/query-affiliates.dto';
import { UpdateAffiliateDto } from './dto/update-affiliate.dto';
const select = {
  id: true,
  fullName: true,
  identification: true,
  identificationType: true,
  birthDate: true,
  gender: true,
  phoneCountryCode: true,
  phoneNationalNumber: true,
  phone: true,
  email: true,
  address: true,
  occupation: true,
  workplace: true,
  affiliateType: true,
  affiliationDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AffiliateSelect;
@Injectable()
export class AffiliatesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly audit?: AuditService,
  ) {}
  async findAll(q: QueryAffiliatesDto) {
    const where: Prisma.AffiliateWhereInput = {
      fullName: q.name ? { contains: q.name, mode: 'insensitive' } : undefined,
      identification: q.identification
        ? { contains: q.identification, mode: 'insensitive' }
        : undefined,
      status: q.status,
      OR: q.search
        ? [
            { fullName: { contains: q.search, mode: 'insensitive' } },
            { identification: { contains: q.search, mode: 'insensitive' } },
            { email: { contains: q.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.affiliate.findMany({
        where,
        select,
        orderBy: { fullName: 'asc' },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      this.prisma.affiliate.count({ where }),
    ]);
    return { data, total, page: q.page, limit: q.limit };
  }
  async findOne(id: number) {
    const item = await this.prisma.affiliate.findUnique({
      where: { id },
      select,
    });
    if (!item) throw new NotFoundException('Affiliate not found');
    return item;
  }
  async update(
    id: number,
    dto: UpdateAffiliateDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    const current = await this.findOne(id);
    if (
      dto.identification !== undefined ||
      dto.identificationType !== undefined
    ) {
      const type = dto.identificationType ?? current.identificationType;
      const value = dto.identification ?? current.identification;
      if (!type || !isValidIdentification(type, value)) {
        throw new BadRequestException(
          'La identificación no corresponde con el tipo seleccionado',
        );
      }
    }
    if (
      dto.phoneCountryCode !== undefined ||
      dto.phoneNationalNumber !== undefined
    ) {
      const code =
        dto.phoneCountryCode ?? current.phoneCountryCode ?? undefined;
      const number =
        dto.phoneNationalNumber ?? current.phoneNationalNumber ?? undefined;
      if (!isValidPhone(code, number))
        throw new BadRequestException('El teléfono no es válido');
    }
    if (dto.identification || dto.email) {
      const duplicate = await this.prisma.affiliate.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(dto.identification
              ? [{ identification: dto.identification }]
              : []),
            ...(dto.email ? [{ email: dto.email }] : []),
          ],
        },
        select: { id: true },
      });
      if (duplicate)
        throw new ConflictException(
          'Identification or email is already registered',
        );
    }
    const item = await this.prisma.affiliate.update({
      where: { id },
      data: dto,
      select,
    });
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.AFFILIATE_UPDATED,
      module: 'AFFILIATES',
      entityType: 'Affiliate',
      entityId: id,
      details: { fields: Object.keys(dto) },
      ...context,
    });
    return item;
  }
  async setStatus(
    id: number,
    status: AffiliateStatus,
    actorId: number,
    context: AuditContext = {},
  ) {
    const current = await this.findOne(id);
    if (current.status === status)
      throw new ConflictException(
        `Affiliate is already ${status.toLowerCase()}`,
      );
    const item = await this.prisma.affiliate.update({
      where: { id },
      data: { status },
      select,
    });
    await this.audit?.log({
      userId: actorId,
      action:
        status === 'ACTIVE'
          ? AuditAction.AFFILIATE_ACTIVATED
          : AuditAction.AFFILIATE_DEACTIVATED,
      module: 'AFFILIATES',
      entityType: 'Affiliate',
      entityId: id,
      ...context,
    });
    return item;
  }
}
