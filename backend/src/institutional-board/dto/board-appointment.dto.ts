import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { BoardPosition } from '../../../generated/prisma/enums';

export class CreateBoardAppointmentDto {
  @Type(() => Number) @IsInt() @IsPositive() personId!: number;
  @IsEnum(BoardPosition) position!: BoardPosition;
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() seatNumber?: number | null;
  @IsOptional() @IsDateString({ strict: true }) startsOn?: string | null;
  @IsOptional() @IsDateString({ strict: true }) endsOn?: string | null;
}

export class UpdateBoardAppointmentDto {
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() personId?: number;
  @IsOptional() @IsEnum(BoardPosition) position?: BoardPosition;
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() seatNumber?: number | null;
  @IsOptional() @IsDateString({ strict: true }) startsOn?: string | null;
  @IsOptional() @IsDateString({ strict: true }) endsOn?: string | null;
}
