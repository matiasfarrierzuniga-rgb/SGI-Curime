import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class RejectUserRequestDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  rejectionReason: string;
}

export class ApproveUserRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roleId: number;
}
