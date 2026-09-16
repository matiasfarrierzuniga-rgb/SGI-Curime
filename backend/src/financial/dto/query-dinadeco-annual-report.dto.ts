import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class QueryDinadecoAnnualReportDto {
  @Transform(({ value }) =>
    typeof value === 'string' && /^\d{4}$/.test(value) ? Number(value) : value,
  )
  @IsInt()
  @Min(1900)
  @Max(2100)
  year!: number;
}
