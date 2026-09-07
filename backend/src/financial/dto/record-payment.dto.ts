import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PaymentMethod } from '../../../generated/prisma/enums';

const DECIMAL_AMOUNT_PATTERN = /^(?!0+(?:\.0{1,2})?$)(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

export class RecordPaymentDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Matches(DECIMAL_AMOUNT_PATTERN, {
    message: 'amount must be a decimal with up to two decimal places',
  })
  amount!: string;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const reference = value.trim();
    return reference || undefined;
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reference?: string;
}
