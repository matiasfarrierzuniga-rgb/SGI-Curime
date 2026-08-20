import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  TokenClaims,
  TokenService,
} from '../../application/ports/token-service.port';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async sign(claims: TokenClaims): Promise<string> {
    return this.jwtService.signAsync(claims);
  }
}
