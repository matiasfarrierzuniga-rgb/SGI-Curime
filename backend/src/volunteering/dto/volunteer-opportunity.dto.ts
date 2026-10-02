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
import { VolunteerOpportunityStatus } from '../../../generated/prisma/enums';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateVolunteerOpportunityDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(5000) description?: string;
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(500) location?: string;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) capacity?: number;
  @Type(() => Date) @IsOptional() @IsDate() applicationDeadline?: Date;
}

export class UpdateVolunteerOpportunityDto {
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) title?: string;
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(5000) description?: string;
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(500) location?: string;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) capacity?: number;
  @Type(() => Date) @IsOptional() @IsDate() applicationDeadline?: Date;
}

export class QueryVolunteerOpportunitiesDto {
  @Transform(trim) @IsOptional() @IsString() @MaxLength(200) search?: string;
  @IsOptional() @IsEnum(VolunteerOpportunityStatus) status?: VolunteerOpportunityStatus;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) @Max(100) limit = 20;
}
