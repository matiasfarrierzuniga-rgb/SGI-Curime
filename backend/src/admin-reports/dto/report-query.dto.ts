import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Min } from 'class-validator';
export class AttendanceReportQueryDto {
  @Type(() => Date) @IsOptional() @IsDate() dateFrom?: Date;
  @Type(() => Date) @IsOptional() @IsDate() dateTo?: Date;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) assemblyId?: number;
}
