import { IsString, MaxLength } from 'class-validator';
import { IsSecurePassword } from './password-policy';

export class ChangePasswordDto {
  @IsString()
  @MaxLength(128)
  currentPassword: string;

  @IsSecurePassword()
  newPassword: string;

  @IsString()
  @MaxLength(128)
  newPasswordConfirmation: string;
}
