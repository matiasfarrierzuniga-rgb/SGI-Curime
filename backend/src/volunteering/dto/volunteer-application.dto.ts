import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  COUNTRY_CODE_PATTERN,
  FULL_NAME_PATTERN,
  IsPhoneFor,
  NATIONAL_NUMBER_PATTERN,
} from '../../common/validation/identity-contact.validation';
import { trim, trimLowercase } from '../../common/validation/normalizers';

export class CreateVolunteerApplicationDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(FULL_NAME_PATTERN)
  fullName: string;

  @Transform(trimLowercase)
  @ValidateIf(
    (dto: CreateVolunteerApplicationDto) =>
      dto.email !== undefined || !dto.phoneNationalNumber,
  )
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @Transform(trim)
  @ValidateIf(
    (dto: CreateVolunteerApplicationDto) =>
      dto.phoneCountryCode !== undefined ||
      dto.phoneNationalNumber !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  @Matches(COUNTRY_CODE_PATTERN)
  phoneCountryCode?: string;

  @Transform(trim)
  @ValidateIf(
    (dto: CreateVolunteerApplicationDto) =>
      dto.phoneCountryCode !== undefined ||
      dto.phoneNationalNumber !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  @Matches(NATIONAL_NUMBER_PATTERN)
  @IsPhoneFor('phoneCountryCode')
  phoneNationalNumber?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  motivation?: string;
}

export class ApproveVolunteerApplicationDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  personId?: number;

  @IsOptional()
  @IsBoolean()
  createPerson?: boolean;
}

export class RejectVolunteerApplicationDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  rejectionReason: string;
}
