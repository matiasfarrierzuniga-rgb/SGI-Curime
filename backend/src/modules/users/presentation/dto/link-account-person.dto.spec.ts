import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LinkAccountPersonDto, VerificationMethod } from './link-account-person.dto';

describe('LinkAccountPersonDto', () => {
  it('accepts bounded explicit administrative evidence', async () => {
    const dto = plainToInstance(LinkAccountPersonDto, {
      userId: 7,
      personId: 12,
      verificationMethod: VerificationMethod.ADMINISTRATIVE_REVIEW,
      evidenceReference: ' ACTA-2026-014 ',
      reason: ' Revisión administrativa de identidad. ',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.evidenceReference).toBe('ACTA-2026-014');
  });

  it('rejects invalid identifiers, method and unbounded evidence', async () => {
    const dto = plainToInstance(LinkAccountPersonDto, {
      userId: 0,
      personId: 'x',
      verificationMethod: 'EMAIL_MATCH',
      evidenceReference: 'x'.repeat(121),
      reason: 'x'.repeat(501),
    });
    expect(await validate(dto)).not.toHaveLength(0);
  });
});
