import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Matches,
  Min,
} from 'class-validator';
import { ReservationStatus } from '../../../generated/prisma/enums';

export class QueryReservationsDto {
  @IsOptional() @IsEnum(ReservationStatus) status?: ReservationStatus;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) resourceId?: number;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) from?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) to?: string;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) @Max(100) limit = 20;
}
