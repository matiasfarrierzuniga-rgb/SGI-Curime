import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  FinancialMethod,
  FinancialMovementStatus,
  FinancialMovementType,
} from '../../../generated/prisma/enums';

export class FinancialMovementFiltersDto {
  @IsOptional()
  @IsEnum(FinancialMovementType)
  type?: FinancialMovementType;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(FinancialMovementStatus)
  status?: FinancialMovementStatus;

  @IsOptional()
  @IsEnum(FinancialMethod)
  method?: FinancialMethod;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  )
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;
}
