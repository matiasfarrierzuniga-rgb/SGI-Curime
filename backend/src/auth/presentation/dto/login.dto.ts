import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { trimLowercase } from '../../../common/validation/normalizers';

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  @Transform(trimLowercase)
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
