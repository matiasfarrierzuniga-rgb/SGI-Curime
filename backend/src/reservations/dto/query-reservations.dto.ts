import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { ReservationStatus } from '../../../generated/prisma/enums';

export class QueryReservationsDto {
  @IsOptional() @IsEnum(ReservationStatus) status?: ReservationStatus;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) resourceId?: number;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) @Max(100) limit = 20;
}
