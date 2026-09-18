import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  MaxLength,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { DonationMethod } from '../../../generated/prisma/enums';

const POSITIVE_DECIMAL_AMOUNT_PATTERN =
  /^(?=.*[1-9])(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateDonationDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  donorName?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  donorIdentification?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @Matches(POSITIVE_DECIMAL_AMOUNT_PATTERN, {
    message: 'amount must be a positive decimal with up to two decimal places',
  })
  amount?: string;

  @IsOptional()
  @IsEnum(DonationMethod)
  method?: DonationMethod;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsDateString()
  receivedAt?: string;
}
