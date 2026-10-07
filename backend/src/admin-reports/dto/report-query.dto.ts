import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AffiliateStatus } from '../../../generated/prisma/enums';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export const SUBSCRIPTION_REPORT_STATUSES = [
  'CURRENT',
  'EXPIRED',
  'UNSPECIFIED',
] as const;

export type SubscriptionReportStatus =
  (typeof SUBSCRIPTION_REPORT_STATUSES)[number];

export class AttendanceReportQueryDto {
  @Type(() => Date) @IsOptional() @IsDate() dateFrom?: Date;
  @Type(() => Date) @IsOptional() @IsDate() dateTo?: Date;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) assemblyId?: number;
}

export class AffiliateReportQueryDto {
  @Transform(trim) @IsOptional() @IsString() @MaxLength(150) search?: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  affiliateType?: string;
  @IsOptional()
  @IsEnum(AffiliateStatus)
  affiliateStatus?: AffiliateStatus;
  @IsOptional()
  @IsIn(SUBSCRIPTION_REPORT_STATUSES)
  subscriptionStatus?: SubscriptionReportStatus;
  @Type(() => Date) @IsOptional() @IsDate() dateFrom?: Date;
  @Type(() => Date) @IsOptional() @IsDate() dateTo?: Date;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) @Max(100) limit = 20;
}
