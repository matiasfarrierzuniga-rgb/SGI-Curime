import { Type } from 'class-transformer';
import { IsDate, IsInt, Min } from 'class-validator';

export class QueryReservationAvailabilityDto {
  @Type(() => Number) @IsInt() @Min(1) resourceId!: number;
  @Type(() => Date) @IsDate() startAt!: Date;
  @Type(() => Date) @IsDate() endAt!: Date;
}
