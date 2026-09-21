import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { InstitutionalOrganizationType } from '../../../generated/prisma/enums';

const normalizeNullable = ({ value }: { value: unknown }) => {
  if (value === null) return null;
  if (typeof value !== 'string') return value;
  return value.trim() || null;
};

const normalizeEmail = ({ value }: { value: unknown }) => {
  const normalized = normalizeNullable({ value });
  return typeof normalized === 'string' ? normalized.toLowerCase() : normalized;
};

export class UpdateInstitutionalProfileDto {
  @Transform(normalizeNullable) @IsOptional() @IsString() @MaxLength(200) legalName?: string | null;
  @Transform(normalizeNullable) @IsOptional() @IsString() @MaxLength(80) legalIdentification?: string | null;
  @Transform(normalizeNullable) @IsOptional() @IsString() @MaxLength(80) dinadecoRegistrationCode?: string | null;
  @Transform(normalizeNullable) @IsOptional() @IsString() @MaxLength(150) dinadecoRegion?: string | null;
  @IsOptional() @IsEnum(InstitutionalOrganizationType) organizationType?: InstitutionalOrganizationType | null;
  @Transform(normalizeNullable) @IsOptional() @IsString() @MaxLength(100) province?: string | null;
  @Transform(normalizeNullable) @IsOptional() @IsString() @MaxLength(100) canton?: string | null;
  @Transform(normalizeNullable) @IsOptional() @IsString() @MaxLength(100) district?: string | null;
  @Transform(normalizeNullable) @IsOptional() @IsString() @MaxLength(150) locality?: string | null;
  @Transform(normalizeNullable) @IsOptional() @IsString() @MaxLength(500) correspondenceAddress?: string | null;
  @Transform(normalizeNullable) @IsOptional() @IsString() @MaxLength(50) phone?: string | null;
  @Transform(normalizeNullable) @IsOptional() @IsString() @MaxLength(50) telefax?: string | null;
  @Transform(normalizeEmail) @IsOptional() @IsEmail() @MaxLength(254) email?: string | null;
}
