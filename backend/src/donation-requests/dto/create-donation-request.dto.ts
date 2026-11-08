import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  DonationRequestKind,
  DonationRequestModality,
  DonationRequestPaymentPreference,
} from '../../../generated/prisma/enums';

const trimmed = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const optionalTrimmed = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || undefined : value;
const email = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() || undefined : value;

export class CreateDonationRequestDto {
  @Transform(trimmed)
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  donorName!: string;
  @Transform(email)
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;
  @Transform(optionalTrimmed)
  @IsOptional()
  @Matches(/^\+?[0-9 ()-]{8,32}$/)
  @MaxLength(32)
  phone?: string;
  @IsEnum(DonationRequestKind)
  kind!: DonationRequestKind;
  @IsEnum(DonationRequestModality)
  modality!: DonationRequestModality;
  @IsOptional()
  @IsEnum(DonationRequestPaymentPreference)
  paymentPreference?: DonationRequestPaymentPreference;
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,12}(?:\.\d{1,2})?$/)
  approximateAmount?: string;
  @Transform(optionalTrimmed)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  goodsDescription?: string;
  @Transform(optionalTrimmed)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comments?: string;
  @IsBoolean()
  anonymousPublic!: boolean;
}
