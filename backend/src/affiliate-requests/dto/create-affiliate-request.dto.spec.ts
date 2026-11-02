import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreateAffiliateRequestDto } from './create-affiliate-request.dto';

describe('CreateAffiliateRequestDto territorial declarations', () => {
  const pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  const payload = {
    identificationType: 'NATIONAL',
    identification: '123456789',
    firstName: 'Ana',
    firstSurname: 'Pérez',
    birthDate: '1990-01-01T00:00:00.000Z',
    address: 'Curime Centro',
    affiliationReason: 'Participar',
  };

  it('accepts optional declared territorial strings without catalog validation', async () => {
    await expect(
      pipe.transform(
        {
          ...payload,
          provinceCode: ' 7 ',
          cantonCode: '02',
          districtCode: '01',
          community: ' Curime Centro ',
        },
        { type: 'body', metatype: CreateAffiliateRequestDto },
      ),
    ).resolves.toMatchObject({
      provinceCode: '7',
      cantonCode: '02',
      districtCode: '01',
      community: 'Curime Centro',
    });
  });

  it('accepts legacy payloads without territorial declarations', async () => {
    await expect(
      pipe.transform(payload, { type: 'body', metatype: CreateAffiliateRequestDto }),
    ).resolves.toMatchObject({
      ...payload,
      birthDate: new Date(payload.birthDate),
    });
  });

  it('rejects malformed or over-posted territorial input', async () => {
    await expect(
      pipe.transform(
        { ...payload, provinceCode: 'x'.repeat(21) },
        { type: 'body', metatype: CreateAffiliateRequestDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      pipe.transform(
        { ...payload, territorialDeclarationStatus: 'VERIFIED' },
        { type: 'body', metatype: CreateAffiliateRequestDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
