import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { trim, trimLowercase } from '../../common/validation/normalizers';

export class CreateCommunityAccountDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  displayName: string;

  @Transform(trimLowercase)
  @IsEmail()
  @MaxLength(254)
  email: string;
}
