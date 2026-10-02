import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  VenturePublicationStatus,
  VentureStatus,
} from '../../../generated/prisma/enums';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateVentureDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(5000) description?: string;
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(5000) offerDescription?: string;
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(50) businessPhone?: string;
  @Transform(trim) @IsOptional() @IsEmail() @MaxLength(254) businessEmail?: string;
  @Transform(trim) @IsOptional() @IsUrl() @MaxLength(2048) websiteUrl?: string;
  @Transform(trim) @IsOptional() @IsUrl() @MaxLength(2048) socialUrl?: string;
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(500) locationText?: string;
  @Type(() => Date) @IsDate() incorporatedAt: Date;
}

export class UpdateVentureDto {
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) name?: string;
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(5000) description?: string;
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(5000) offerDescription?: string;
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(50) businessPhone?: string;
  @Transform(trim) @IsOptional() @IsEmail() @MaxLength(254) businessEmail?: string;
  @Transform(trim) @IsOptional() @IsUrl() @MaxLength(2048) websiteUrl?: string;
  @Transform(trim) @IsOptional() @IsUrl() @MaxLength(2048) socialUrl?: string;
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(500) locationText?: string;
  @Type(() => Date) @IsOptional() @IsDate() incorporatedAt?: Date;
}

export class QueryVenturesDto {
  @Transform(trim) @IsOptional() @IsString() @MaxLength(200) search?: string;
  @IsOptional() @IsEnum(VentureStatus) status?: VentureStatus;
  @IsOptional() @IsEnum(VenturePublicationStatus) publicationStatus?: VenturePublicationStatus;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) @Max(100) limit = 20;
}
