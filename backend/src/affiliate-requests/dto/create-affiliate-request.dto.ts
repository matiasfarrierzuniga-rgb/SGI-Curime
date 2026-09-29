import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxDate,
  MaxLength,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  COUNTRY_CODE_PATTERN,
  FULL_NAME_PATTERN,
  IsIdentificationFor,
  IsPhoneFor,
  NATIONAL_NUMBER_PATTERN,
} from '../../common/validation/identity-contact.validation';
import { trim, trimLowercase } from '../../common/validation/normalizers';

export class CreateAffiliateRequestDto {
  @Transform(trim)
  @IsIn(['NATIONAL', 'DIMEX'])
  identificationType: 'NATIONAL' | 'DIMEX';

  @Transform(trim)
  @IsString()
  @IsIdentificationFor('identificationType')
  identification: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Matches(FULL_NAME_PATTERN)
  firstName: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Matches(FULL_NAME_PATTERN)
  firstSurname: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Matches(FULL_NAME_PATTERN)
  secondSurname?: string;

  @Type(() => Date) @IsDate() @MaxDate(new Date()) birthDate: Date;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  gender?: string;

  @Transform(trim)
  @ValidateIf(
    (dto: CreateAffiliateRequestDto) =>
      dto.phoneCountryCode !== undefined || dto.phoneNationalNumber !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  @Matches(NATIONAL_NUMBER_PATTERN)
  @IsPhoneFor('phoneCountryCode')
  phoneNationalNumber?: string;

  @Transform(trim)
  @ValidateIf(
    (dto: CreateAffiliateRequestDto) =>
      dto.phoneCountryCode !== undefined || dto.phoneNationalNumber !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  @Matches(COUNTRY_CODE_PATTERN)
  phoneCountryCode?: string;

  @Transform(trimLowercase)
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(300) address: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  occupation?: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  workplace?: string;
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(1000)
  affiliationReason: string;
}
