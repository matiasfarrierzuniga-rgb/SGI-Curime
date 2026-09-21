import { Injectable } from '@nestjs/common';
import { AuditAction } from '../audit/audit-actions';
import { AuditService, type AuditContext } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateInstitutionalProfileDto } from './dto/update-institutional-profile.dto';

const PROFILE_ID = 1;

@Injectable()
export class InstitutionalProfileService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  get() {
    return this.prisma.institutionalProfile.findUniqueOrThrow({ where: { id: PROFILE_ID } });
  }

  update(dto: UpdateInstitutionalProfileDto, actorId: number, context: AuditContext = {}) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.institutionalProfile.findUniqueOrThrow({ where: { id: PROFILE_ID } });
      const changedFields = Object.keys(dto).filter((field) => {
        const key = field as keyof UpdateInstitutionalProfileDto;
        return dto[key] !== undefined && current[key] !== dto[key];
      });

      const profile = await tx.institutionalProfile.update({ where: { id: PROFILE_ID }, data: dto });
      await this.audit.log({
        userId: actorId,
        action: AuditAction.INSTITUTIONAL_PROFILE_UPDATED,
        module: 'ADMINISTRATIVE',
        entityType: 'InstitutionalProfile',
        entityId: PROFILE_ID,
        details: { changedFields },
        ...context,
      }, tx);
      return profile;
    });
  }
}
