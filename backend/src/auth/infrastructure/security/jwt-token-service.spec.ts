import { JwtService } from '@nestjs/jwt';
import { JwtTokenService } from './jwt-token-service';

describe('JwtTokenService', () => {
  it('signs the token claims through the JWT service', async () => {
    const jwtService = { signAsync: jest.fn().mockResolvedValue('signed') };
    const service = new JwtTokenService(jwtService as unknown as JwtService);

    await expect(
      service.sign({ sub: 1, email: 'a@b.c', role: 'Administrador' }),
    ).resolves.toBe('signed');
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 1,
      email: 'a@b.c',
      role: 'Administrador',
    });
  });
});
