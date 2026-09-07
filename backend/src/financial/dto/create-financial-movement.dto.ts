import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { FinancialMovementType } from '../../../generated/prisma/enums';

const POSITIVE_DECIMAL_AMOUNT_PATTERN =
  /^(?=.*[1-9])(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const trimOptional = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed || undefined;
};

export class CreateFinancialMovementDto {
  @IsEnum(FinancialMovementType)
  type!: FinancialMovementType;

  @Transform(trim)
  @IsString()
  @Matches(POSITIVE_DECIMAL_AMOUNT_PATTERN, {
    message: 'amount must be a positive decimal with up to two decimal places',
  })
  amount!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  description!: string;

  @Transform(trimOptional)
  @IsOptional()
  @IsString()
  reference?: string;

  @IsDateString()
  occurredAt!: string;
}
