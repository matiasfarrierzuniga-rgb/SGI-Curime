import { Transform } from 'class-transformer';
import { Equals, IsBoolean, IsEmail, IsIn, MaxLength } from 'class-validator';
import { trimLowercase } from '../../common/validation/normalizers';

export class CorrectCommunityEmailDto {
  @Transform(trimLowercase)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsBoolean()
  @Equals(true)
  identityVerified: boolean;

  @IsIn(['IN_PERSON', 'INSTITUTIONAL'])
  verificationMethod: 'IN_PERSON' | 'INSTITUTIONAL';
}
