import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateLoanDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  itemId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  borrowerName: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  borrowerAffiliateId?: number;

  @IsOptional()
  @IsDateString()
  loanDate?: string;

  @IsDateString()
  expectedReturnDate: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
