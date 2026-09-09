import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { DonationMethod } from '../../../generated/prisma/enums';

const POSITIVE_DECIMAL_AMOUNT_PATTERN =
  /^(?=.*[1-9])(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

const trimOptional = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed || undefined;
};

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateDonationDto {
  @Transform(trimOptional)
  @IsOptional()
  @IsString()
  donorName?: string;

  @Transform(trimOptional)
  @IsOptional()
  @IsString()
  donorIdentification?: string;

  @Transform(trim)
  @IsString()
  @Matches(POSITIVE_DECIMAL_AMOUNT_PATTERN, {
    message: 'amount must be a positive decimal with up to two decimal places',
  })
  amount!: string;

  @IsEnum(DonationMethod)
  method!: DonationMethod;

  @Transform(trimOptional)
  @IsOptional()
  @IsString()
  reference?: string;

  @Transform(trimOptional)
  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  receivedAt!: string;
}
