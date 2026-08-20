import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { InventoryItemCondition } from '../../../generated/prisma/enums';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ReturnLoanDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  returnNotes?: string;

  @IsOptional()
  @IsEnum(InventoryItemCondition)
  condition?: InventoryItemCondition;
}
