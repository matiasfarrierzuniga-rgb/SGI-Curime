import { BadRequestException } from '@nestjs/common';
import { ReservationStatus } from '../../generated/prisma/enums';

const allowedTransitions: Readonly<
  Record<ReservationStatus, readonly ReservationStatus[]>
> = {
  [ReservationStatus.PENDING]: [
    ReservationStatus.APPROVED,
    ReservationStatus.REJECTED,
    ReservationStatus.CANCELLED,
  ],
  [ReservationStatus.APPROVED]: [ReservationStatus.CANCELLED],
  [ReservationStatus.CONFIRMED]: [ReservationStatus.CANCELLED],
  [ReservationStatus.REJECTED]: [],
  [ReservationStatus.CANCELLED]: [],
  [ReservationStatus.COMPLETED]: [],
};

export function assertReservationTransition(
  from: ReservationStatus,
  to: ReservationStatus,
) {
  if (!allowedTransitions[from]?.includes(to)) {
    throw new BadRequestException(
      `Reservation transition from ${from} to ${to} is not allowed`,
    );
  }
}
