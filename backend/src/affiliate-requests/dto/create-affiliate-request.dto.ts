import { Transform, Type } from 'class-transformer';
import { IdentificationType } from '../../../generated/prisma/client';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxDate,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import {
  FULL_NAME_PATTERN,
  IsIdentificationFor,
  IsPhoneFor,
} from '../../common/validation/identity-contact.validation';
import { trim, trimLowercase } from '../../common/validation/normalizers';

export class CreateAffiliateRequestDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  @Matches(FULL_NAME_PATTERN)
  firstName: string;
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  @Matches(FULL_NAME_PATTERN)
  firstSurname: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  @Matches(FULL_NAME_PATTERN)
  secondSurname?: string;
  @IsEnum(IdentificationType)
  identificationType: IdentificationType;
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @IsIdentificationFor('identificationType')
  identification: string;
  @Type(() => Date) @IsDate() @MaxDate(new Date()) birthDate: Date;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  gender?: string;
  @Transform(trim)
  @IsOptional()
  @Matches(/^\+[1-9][0-9]{0,3}$/)
  phoneCountryCode?: string;
  @Transform(trim)
  @IsPhoneFor('phoneCountryCode')
  phoneNationalNumber?: string;
  @Transform(trimLowercase)
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(300) address: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  occupation?: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  workplace?: string;
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(1000)
  affiliationReason: string;
}
