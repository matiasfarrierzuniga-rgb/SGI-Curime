import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  CapabilityGuard,
  JwtAuthGuard,
  RequireCapabilities,
  type AuthenticatedUser,
} from '../../../../auth';
import { LinkAccountPersonUseCase } from '../../application/use-cases/link-account-person.use-case';
import { LinkAccountPersonDto } from '../dto/link-account-person.dto';
import { toUserResponse } from '../mappers/user-response.mapper';
import { toHttpError } from '../mappers/users-error.mapper';

@Controller('identity/account-person-links')
@UseGuards(JwtAuthGuard, CapabilityGuard)
export class IdentityAccountLinksController {
  constructor(private readonly linkAccountPerson: LinkAccountPersonUseCase) {}

  @Post()
  @RequireCapabilities('system.identity.manage')
  async create(
    @Body() dto: LinkAccountPersonDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    try {
      return toUserResponse(
        await this.linkAccountPerson.execute({
          userId: dto.userId,
          personId: dto.personId,
          actorId: req.user.id,
          evidenceReference: dto.evidenceReference,
          reason: dto.reason,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }),
      );
    } catch (error) {
      toHttpError(error);
    }
  }
}
