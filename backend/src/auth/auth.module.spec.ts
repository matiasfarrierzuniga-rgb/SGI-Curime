import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ActivateAccountUseCase } from './application/use-cases/activate-account.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RequestPasswordResetUseCase } from './application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { AUDIT_PORT } from './application/ports/audit.port';
import { AUTH_REPOSITORY } from './application/ports/auth-repository.port';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { PASSWORD_RESET_DELIVERY_PORT } from './application/ports/password-reset-delivery.port';
import { TOKEN_SERVICE } from './application/ports/token-service.port';
import { AuthModule } from './auth.module';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MAX_LOGIN_ATTEMPTS = '5';
process.env.ACCOUNT_LOCKOUT_MINUTES = '30';
process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES = '30';

describe('AuthModule runtime DI', () => {
  it('resolves every application port through its runtime token', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(AUDIT_PORT)
      .useValue({ record: jest.fn() })
      .compile();

    expect(moduleRef.get(AUTH_REPOSITORY)).toBeDefined();
    expect(moduleRef.get(PASSWORD_HASHER)).toBeDefined();
    expect(moduleRef.get(TOKEN_SERVICE)).toBeDefined();
    expect(moduleRef.get(PASSWORD_RESET_DELIVERY_PORT)).toBeDefined();
    expect(moduleRef.get(LoginUseCase)).toBeDefined();
    expect(moduleRef.get(ActivateAccountUseCase)).toBeDefined();
    expect(moduleRef.get(RequestPasswordResetUseCase)).toBeDefined();
    expect(moduleRef.get(ResetPasswordUseCase)).toBeDefined();
    expect(moduleRef.get(ChangePasswordUseCase)).toBeDefined();

    await moduleRef.close();
  });
});
