import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  CapabilityGuard,
  JwtAuthGuard,
  RequireCapabilities,
  type AuthenticatedUser,
} from '../../../../auth';
import { CreatePersonUseCase } from '../../application/use-cases/create-person.use-case';
import { CreatePersonDto } from '../dto/create-person.dto';
import { toHttpError } from '../mappers/users-error.mapper';

@Controller('identity/persons')
@UseGuards(JwtAuthGuard, CapabilityGuard)
export class IdentityPersonsController {
  constructor(private readonly createPerson: CreatePersonUseCase) {}

  @Post()
  @RequireCapabilities('system.identity.manage')
  create(
    @Body() dto: CreatePersonDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.run(() =>
      this.createPerson.execute({
        ...dto,
        actorId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }),
    );
  }

  private async run<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      toHttpError(error);
    }
  }
}
