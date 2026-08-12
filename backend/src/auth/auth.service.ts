import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<{
    accessToken: string;
    user: AuthenticatedUser;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: { role: true },
    });

    if (!user || user.status !== 'ACTIVE' || user.lockedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        status: user.status,
        role: user.role.name,
      },
    };
  }
}
