import { IsOptional } from 'class-validator';

export class RefreshTokenDto {
  @IsOptional()
  refreshToken?: unknown;
}
