import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  MinLength,
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
  @Type(() => Number) @IsInt() @Min(1) affiliateId!: number;
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(2000)
  reason!: string;
}
export class DecisionJustificationDto {
  @IsEnum(JustificationStatus)
  status!: JustificationStatus;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observation?: string;
}
export class ApproveJustificationDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observation?: string;
}
export class RejectJustificationDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  rejectionReason!: string;
}
export class RegisterAffiliateJustificationDto {
  @Type(() => Number) @IsInt() @Min(1) assemblyId!: number;
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(2000)
  reason!: string;
}
export class QueryJustificationsDto {
  @IsOptional() @IsEnum(JustificationStatus) status?: JustificationStatus;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) assemblyId?: number;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) affiliateId?: number;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) @Max(100) limit = 20;
}
