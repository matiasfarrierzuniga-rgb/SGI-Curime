import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { RequestStatus } from '../../../generated/prisma/enums';
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
export class QueryAffiliateRequestsDto {
  @IsOptional() @IsEnum(RequestStatus) status?: RequestStatus;
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsEmail()
  email?: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  identification?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(150) search?: string;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) @Max(100) limit = 20;
}
