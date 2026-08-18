import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SanctionStatus } from '../../../generated/prisma/enums';
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
export class CreateSanctionDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(300) reason: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description?: string;
  @Type(() => Date) @IsOptional() @IsDate() date?: Date;
  @IsOptional() @IsEnum(SanctionStatus) status?: SanctionStatus;
}
export class UpdateSanctionDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  reason?: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description?: string;
  @Type(() => Date) @IsOptional() @IsDate() date?: Date;
  @IsOptional() @IsEnum(SanctionStatus) status?: SanctionStatus;
}
export class QuerySanctionsDto {
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) affiliateId?: number;
  @IsOptional() @IsEnum(SanctionStatus) status?: SanctionStatus;
  @Type(() => Date) @IsOptional() @IsDate() dateFrom?: Date;
  @Type(() => Date) @IsOptional() @IsDate() dateTo?: Date;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) @Max(100) limit = 20;
}
