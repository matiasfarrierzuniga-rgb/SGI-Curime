import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePersonDto } from './create-person.dto';

const valid = {
  identificationType: 'NATIONAL',
  identification: ' 123456789 ',
  firstName: ' Ana ',
  firstSurname: ' Pérez ',
  secondSurname: ' Mora ',
  phoneCountryCode: '+506',
  phoneNationalNumber: '88888888',
  address: ' Curime ',
  reason: ' Alta administrativa para aprovisionamiento RBAC. ',
};

describe('CreatePersonDto', () => {
  it('accepts a complete structured administrative identity', async () => {
    const dto = plainToInstance(CreatePersonDto, valid);

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.identification).toBe('123456789');
    expect(dto.firstName).toBe('Ana');
    expect(dto.reason).toBe('Alta administrativa para aprovisionamiento RBAC.');
  });

  it.each([
    ['invalid national identification', { identification: '012345678' }],
    ['invalid identification type', { identificationType: 'FOREIGN' }],
    ['missing first name', { firstName: '' }],
    ['blank reason', { reason: ' ' }],
    ['short reason', { reason: 'x' }],
    ['incomplete phone pair', { phoneNationalNumber: undefined }],
  ])('rejects %s', async (_label, overrides) => {
    const dto = plainToInstance(CreatePersonDto, { ...valid, ...overrides });

    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('rejects an invalid DIMEX length', async () => {
    const dto = plainToInstance(CreatePersonDto, {
      ...valid,
      identificationType: 'DIMEX',
      identification: '123456789',
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });
});
