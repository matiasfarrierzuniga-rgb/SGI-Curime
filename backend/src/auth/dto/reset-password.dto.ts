import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { IsSecurePassword } from './password-policy';

export class ResetPasswordDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  token: string;

  @IsSecurePassword()
  password: string;

  @IsString()
  @MaxLength(128)
  passwordConfirmation: string;
}
