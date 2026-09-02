import { BadRequestException } from '@nestjs/common';
import { PublicationStatus } from '../../generated/prisma/enums';

const allowedTransitions: Readonly<
  Record<PublicationStatus, readonly PublicationStatus[]>
> = {
  [PublicationStatus.INTERNAL]: [],
  [PublicationStatus.DRAFT]: [PublicationStatus.REVIEW],
  [PublicationStatus.REVIEW]: [
    PublicationStatus.DRAFT,
    PublicationStatus.PUBLISHED,
  ],
  [PublicationStatus.PUBLISHED]: [PublicationStatus.ARCHIVED],
  [PublicationStatus.ARCHIVED]: [],
};

export function assertPublicationTransition(
  from: PublicationStatus,
  to: PublicationStatus,
) {
  if (!allowedTransitions[from]?.includes(to)) {
    throw new BadRequestException(
      `Publication transition from ${from} to ${to} is not allowed`,
    );
  }
}
