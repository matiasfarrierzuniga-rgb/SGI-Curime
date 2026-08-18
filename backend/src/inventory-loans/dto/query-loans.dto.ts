import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { InventoryLoanStatus } from '../../../generated/prisma/enums';

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
};

export class QueryLoansDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  itemId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  affiliateId?: number;

  @IsOptional()
  @IsEnum(InventoryLoanStatus)
  status?: InventoryLoanStatus;

  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  overdue?: boolean;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
