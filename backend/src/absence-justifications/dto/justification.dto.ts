import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { JustificationStatus } from '../../../generated/prisma/enums';
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
export class CreateJustificationDto {
  @Type(() => Number) @IsInt() @Min(1) affiliateId: number;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(2000) reason: string;
}
export class RejectJustificationDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  rejectionReason: string;
}
export class QueryJustificationsDto {
  @IsOptional() @IsEnum(JustificationStatus) status?: JustificationStatus;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) assemblyId?: number;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) affiliateId?: number;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) @Max(100) limit = 20;
}
