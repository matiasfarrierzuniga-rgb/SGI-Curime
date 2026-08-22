import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { IsSecurePassword } from './password-policy';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ActivateAccountDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  token: string;

  @IsSecurePassword()
  password: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  passwordConfirmation: string;
}
