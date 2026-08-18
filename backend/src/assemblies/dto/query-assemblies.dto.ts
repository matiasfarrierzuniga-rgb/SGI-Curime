import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AssemblyStatus } from '../../../generated/prisma/enums';
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
export class QueryAssembliesDto {
  @Transform(trim) @IsOptional() @IsString() @MaxLength(200) search?: string;
  @IsOptional() @IsEnum(AssemblyStatus) status?: AssemblyStatus;
  @Type(() => Date) @IsOptional() @IsDate() dateFrom?: Date;
  @Type(() => Date) @IsOptional() @IsDate() dateTo?: Date;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) @Max(100) limit = 20;
}
