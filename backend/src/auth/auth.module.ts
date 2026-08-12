import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        const expiresIn = process.env.JWT_EXPIRES_IN;

        if (!secret) {
          throw new Error('JWT_SECRET must be configured to enable authentication.');
        }

        if (!expiresIn) {
          throw new Error(
            'JWT_EXPIRES_IN must be configured to enable authentication.',
          );
        }

        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as StringValue,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
