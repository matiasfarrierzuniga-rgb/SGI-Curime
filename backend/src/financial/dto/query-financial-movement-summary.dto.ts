import { IsDateString, IsOptional } from 'class-validator';

export class QueryFinancialMovementSummaryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
