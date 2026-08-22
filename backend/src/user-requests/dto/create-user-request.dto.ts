import { Transform } from 'class-transformer';
import { IdentificationType } from '../../../generated/prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  IsIdentificationFor,
  IsPhoneFor,
  FULL_NAME_PATTERN,
} from '../../common/validation/identity-contact.validation';
import { trim, trimLowercase } from '../../common/validation/normalizers';

export class CreateUserRequestDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  @Matches(FULL_NAME_PATTERN, {
    message:
      'El nombre completo debe contener letras y solo puede usar espacios, apóstrofes o guiones.',
  })
  fullName: string;

  @IsEnum(IdentificationType)
  identificationType: IdentificationType;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @IsIdentificationFor('identificationType')
  identification: string;

  @Transform(trimLowercase)
  @IsEmail()
  @MaxLength(254)
  email: string;

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
  @MinLength(3)
  @MaxLength(1000)
  reason: string;
}
