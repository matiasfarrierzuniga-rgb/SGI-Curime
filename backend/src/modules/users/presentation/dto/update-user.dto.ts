import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import {
  FULL_NAME_PATTERN,
  IsPhoneFor,
} from '../../../../common/validation/identity-contact.validation';
import { trim, trimLowercase } from '../../../../common/validation/normalizers';

export class UpdateUserDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  @Matches(FULL_NAME_PATTERN)
  fullName?: string;

  @Transform(trimLowercase)
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @Transform(trim)
  @IsOptional()
  @Matches(/^\+[1-9][0-9]{0,3}$/)
  phoneCountryCode?: string;
  @Transform(trim)
  @IsOptional()
  @IsPhoneFor('phoneCountryCode')
  phoneNationalNumber?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  address?: string;
}
