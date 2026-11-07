import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';
import { trimLowercase } from '../../common/validation/normalizers';

export class CreateCommunityAccountDto {
  @Transform(trimLowercase)
  @IsEmail()
  @MaxLength(254)
  email: string;
}
