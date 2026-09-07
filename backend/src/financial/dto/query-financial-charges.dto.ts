import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { FinancialChargeStatus } from '../../../generated/prisma/enums';

export class QueryFinancialChargesDto {
  @IsOptional() @IsEnum(FinancialChargeStatus) status?: FinancialChargeStatus;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) reservationId?: number;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) @Max(100) limit = 20;
}
