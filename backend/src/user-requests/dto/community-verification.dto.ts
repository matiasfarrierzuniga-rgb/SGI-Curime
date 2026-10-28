import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { trim, trimLowercase } from '../../common/validation/normalizers';

export class VerifyCommunityEmailDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  token: string;
}

export class ResendCommunityVerificationDto {
  @Transform(trimLowercase)
  @IsEmail()
  @MaxLength(254)
  email: string;
}
