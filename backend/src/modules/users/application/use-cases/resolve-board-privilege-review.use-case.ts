import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { AuditService, type AuditContext } from '../../../../audit/audit.service';
import { Prisma } from '../../../../../generated/prisma/client';
import { ChangeUserRoleUseCase } from './change-user-role.use-case';
import type { PrivilegeReviewDecision } from '../../presentation/dto/resolve-board-privilege-review.dto';
import {
  USERS_REPOSITORY,
  type UsersRepository,
} from '../../domain/repositories/users-repository';
import type { AuditPort } from '../ports/audit.port';

@Injectable()
export class ResolveBoardPrivilegeReviewUseCase {
  constructor(
    private readonly audit: AuditService,
    private readonly changeUserRole: ChangeUserRoleUseCase,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
  ) {}

  list(page: number, limit: number) {
    return this.audit.findBoardPrivilegeReviews(page, limit);
  }

  async execute(
    reviewId: number,
    input: {
      decision: PrivilegeReviewDecision;
      justification: string;
      roleId?: number;
    },
    actorId: number,
    context: AuditContext,
  ) {
    try {
      await this.usersRepository.withTransaction(async (tx, client) => {
        const review = await this.audit.lockBoardPrivilegeReview(reviewId, client);
        if (review.resolution)
          throw new ConflictException('La revisión de privilegios ya fue resuelta.');
        if (!review.account && input.decision === 'ROLE_CHANGED')
          throw new BadRequestException(
            'No se puede cambiar el rol de una Persona sin cuenta SGI vinculada.',
          );
        if (review.account && review.account.id === actorId)
          throw new ForbiddenException('No puede resolver una revisión sobre su propia cuenta.');

        let roleChange: { previousRoleId: number; newRoleId: number } | null = null;
        if (input.decision === 'ROLE_CHANGED' && review.account) {
          if (!input.roleId)
            throw new BadRequestException('Debe seleccionar un rol canónico autorizado.');
          if (input.roleId === review.account.role.id)
            throw new BadRequestException(
              'El rol seleccionado ya es el rol técnico efectivo de la cuenta.',
            );
          const auditPort: AuditPort = {
            record: (event) => this.audit.log(event, client).then(() => undefined),
          };
          await this.changeUserRole.executeInTransaction(
            tx,
            review.account.id,
            input.roleId,
            actorId,
            context,
            auditPort,
          );
          roleChange = {
            previousRoleId: review.account.role.id,
            newRoleId: input.roleId,
          };
        }

        await this.audit.recordBoardPrivilegeReviewResolution(
          reviewId,
          actorId,
          input.decision,
          input.justification,
          roleChange,
          context,
          client,
        );
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new ConflictException(
          'La revisión cambió durante la operación. Actualice la información antes de reintentar.',
        );
      }
      throw error;
    }

    return this.audit.findBoardPrivilegeReview(reviewId);
  }
}
