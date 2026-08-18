import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import {
  InventoryItemStatus,
  InventoryMovementType,
} from '../../../generated/prisma/enums';

export class QueryReportsDto {
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
  categoryId?: number;

  @IsOptional()
  @IsEnum(InventoryItemStatus)
  status?: InventoryItemStatus;

  @IsOptional()
  @IsEnum(InventoryMovementType)
  type?: InventoryMovementType;

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
