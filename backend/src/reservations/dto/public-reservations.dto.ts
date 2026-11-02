import { Type } from 'class-transformer';
import { IsInt, Matches, Min } from 'class-validator';
import { ResourcePricingType } from '../../../generated/prisma/client';

export class QueryPublicReservationOccupancyDto {
  @Type(() => Number) @IsInt() @Min(1) resourceId!: number;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) from!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) to!: string;
}

export class PublicReservableResourceDto {
  id!: number;
  name!: string;
  description!: string | null;
  location!: string | null;
  capacity!: number | null;
  pricingType!: ResourcePricingType;
  price!: string | null;
  currency!: string;
}

export class PublicReservationOccupancySlotDto {
  startAt!: Date;
  endAt!: Date;
}

export class PublicReservationOccupancyDto {
  resourceId!: number;
  slots!: PublicReservationOccupancySlotDto[];
}

export class PublicReservationAvailabilityDto {
  available!: boolean;
}
