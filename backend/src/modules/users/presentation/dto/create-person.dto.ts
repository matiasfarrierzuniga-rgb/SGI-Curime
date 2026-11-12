import { Transform } from 'class-transformer';
import { IdentificationType } from '../../../../../generated/prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  FULL_NAME_PATTERN,
  IsIdentificationFor,
  IsPhoneFor,
} from '../../../../common/validation/identity-contact.validation';
import { trim } from '../../../../common/validation/normalizers';

export class CreatePersonDto {
  @IsEnum(IdentificationType)
  identificationType: IdentificationType;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @IsIdentificationFor('identificationType')
  identification: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  @Matches(FULL_NAME_PATTERN)
  firstName: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  @Matches(FULL_NAME_PATTERN)
  firstSurname: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  @Matches(FULL_NAME_PATTERN)
  secondSurname?: string;

  @Transform(trim)
  @IsOptional()
  @Matches(/^\+[1-9][0-9]{0,3}$/)
  phoneCountryCode?: string;

  @Transform(trim)
  @IsPhoneFor('phoneCountryCode')
  phoneNationalNumber?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  address?: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  reason: string;
}
