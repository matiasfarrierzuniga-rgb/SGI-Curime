import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export function IsSecurePassword() {
  return applyDecorators(
    IsString(),
    MinLength(10),
    MaxLength(128),
    Matches(/[a-z]/, { message: 'password must contain a lowercase letter' }),
    Matches(/[A-Z]/, { message: 'password must contain an uppercase letter' }),
    Matches(/\d/, { message: 'password must contain a number' }),
  );
}
