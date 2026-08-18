import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
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
export class QueryAffiliatesDto {
  @Transform(trim) @IsOptional() @IsString() @MaxLength(150) name?: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  identification?: string;
  @IsOptional() @IsEnum(AffiliateStatus) status?: AffiliateStatus;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(150) search?: string;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) @Max(100) limit = 20;
}
