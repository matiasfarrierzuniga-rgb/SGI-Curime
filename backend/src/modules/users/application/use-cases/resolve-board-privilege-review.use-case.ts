import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService, type AuditContext } from '../../../../audit/audit.service';
import { ChangeUserRoleUseCase } from './change-user-role.use-case';
import type { PrivilegeReviewDecision } from '../../presentation/dto/resolve-board-privilege-review.dto';

@Injectable()
export class ResolveBoardPrivilegeReviewUseCase {
  constructor(
    private readonly audit: AuditService,
    private readonly changeUserRole: ChangeUserRoleUseCase,
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
    const review = await this.audit.findBoardPrivilegeReview(reviewId);
    if (review.resolution)
      throw new BadRequestException('La revisión de privilegios ya fue resuelta.');
    if (!review.account)
      throw new NotFoundException(
        'La Persona afectada no tiene una cuenta SGI vinculada para revisar.',
      );
    if (review.account.id === actorId)
      throw new ForbiddenException('No puede resolver una revisión sobre su propia cuenta.');

    let roleChange: { previousRoleId: number; newRoleId: number } | null = null;
    if (input.decision === 'ROLE_CHANGED') {
      if (!input.roleId)
        throw new BadRequestException('Debe seleccionar un rol canónico autorizado.');
      if (input.roleId === review.account.role.id)
        throw new BadRequestException(
          'El rol seleccionado ya es el rol técnico efectivo de la cuenta.',
        );
      await this.changeUserRole.execute(
        review.account.id,
        input.roleId,
        actorId,
        context,
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
    );
    return this.audit.findBoardPrivilegeReview(reviewId);
  }
}
