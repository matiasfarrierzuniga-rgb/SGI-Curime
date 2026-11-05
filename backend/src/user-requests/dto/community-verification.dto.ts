import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsSecurePassword } from '../../auth/presentation/dto/password-policy';
import { trim, trimLowercase } from '../../common/validation/normalizers';

export class VerifyCommunityEmailDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  token: string;
}

export class CompleteCommunityActivationDto extends VerifyCommunityEmailDto {
  @IsSecurePassword()
  password: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  passwordConfirmation: string;
}

export class ResendCommunityVerificationDto {
  @Transform(trimLowercase)
  @IsEmail()
  @MaxLength(254)
  email: string;
}
