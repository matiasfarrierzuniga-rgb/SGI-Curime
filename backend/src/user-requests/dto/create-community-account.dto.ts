import { Transform } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { FULL_NAME_PATTERN } from '../../common/validation/identity-contact.validation';
import { trim, trimLowercase } from '../../common/validation/normalizers';
import { IsSecurePassword } from '../../auth/presentation/dto/password-policy';

export class CreateCommunityAccountDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Matches(FULL_NAME_PATTERN)
  fullName: string;

  @Transform(trimLowercase)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsSecurePassword()
  password: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  passwordConfirmation: string;

  @IsBoolean()
  @Equals(true)
  privacyAcknowledgement: boolean;
}
