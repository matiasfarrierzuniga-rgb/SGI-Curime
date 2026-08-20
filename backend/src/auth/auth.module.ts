import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivateAccountUseCase } from './application/use-cases/activate-account.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RequestPasswordResetUseCase } from './application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { AUDIT_PORT } from './application/ports/audit.port';
import { AuditServiceAdapter } from './infrastructure/audit/audit-service.adapter';
import { PrismaAuthRepository } from './infrastructure/persistence/prisma-auth.repository';
import { PasswordResetTokenDeliveryService } from './infrastructure/password-reset-token-delivery.service';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { JwtTokenService } from './infrastructure/security/jwt-token-service';
import { AuthController } from './presentation/controllers/auth.controller';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { RolesGuard } from './presentation/guards/roles.guard';
import { JwtStrategy } from './presentation/strategies/jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        const expiresIn = process.env.JWT_EXPIRES_IN;

        if (!secret) {
          throw new Error(
            'JWT_SECRET must be configured to enable authentication.',
          );
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
  providers: [
    PrismaAuthRepository,
    BcryptPasswordHasher,
    JwtTokenService,
    { provide: AUDIT_PORT, useClass: AuditServiceAdapter },
    PasswordResetTokenDeliveryService,
    LoginUseCase,
    ActivateAccountUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    ChangePasswordUseCase,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
