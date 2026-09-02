import { Transform } from 'class-transformer';
import { IdentificationType } from '../../../../../generated/prisma/client';
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
  FULL_NAME_PATTERN,
  IsIdentificationFor,
  IsPhoneFor,
} from '../../../../common/validation/identity-contact.validation';
import { trim, trimLowercase } from '../../../../common/validation/normalizers';
import { IsSecurePassword } from '../../../../auth/presentation/dto/password-policy';

export class RegisterUserDto {
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

  @IsSecurePassword()
  password: string;
}
