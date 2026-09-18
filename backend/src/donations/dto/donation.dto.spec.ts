import { ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DonationMethod } from '../../../generated/prisma/enums';
import { CreateDonationDto } from './create-donation.dto';
import { UpdateDonationDto } from './update-donation.dto';

describe('Donation DTOs', () => {
  const validDonation = {
    donorName: 'Persona donante',
    donorIdentification: '1-2345-6789',
    amount: '1250.50',
    method: DonationMethod.SINPE_MOVIL,
    reference: 'SINPE-001',
    description: 'Aporte mensual',
    receivedAt: '2026-09-09T16:00:00.000Z',
  };

  it('accepts and normalizes a valid creation payload', async () => {
    const dto = plainToInstance(CreateDonationDto, {
      ...validDonation,
      donorName: '  Persona donante  ',
      reference: '  SINPE-001  ',
      description: '  Aporte mensual  ',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.donorName).toBe('Persona donante');
    expect(dto.reference).toBe('SINPE-001');
    expect(dto.description).toBe('Aporte mensual');
  });

  it('normalizes blank optional creation fields to undefined', async () => {
    const dto = plainToInstance(CreateDonationDto, {
      ...validDonation,
      donorName: '  ',
      donorIdentification: '',
      reference: '   ',
      description: '',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.donorName).toBeUndefined();
    expect(dto.donorIdentification).toBeUndefined();
    expect(dto.reference).toBeUndefined();
    expect(dto.description).toBeUndefined();
  });

  it.each(['0', '0.00', '-1', '1.234', '01.00', 'not-a-number'])(
    'rejects invalid amount %s',
    async (amount) => {
      const dto = plainToInstance(CreateDonationDto, {
        ...validDonation,
        amount,
      });

      expect(await validate(dto)).not.toHaveLength(0);
    },
  );

  it('rejects missing required creation fields and invalid values', async () => {
    const dto = plainToInstance(CreateDonationDto, {
      amount: '100.00',
      method: 'TRANSFER',
      receivedAt: 'not-a-date',
    });

    const errors = await validate(dto);
    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['method', 'receivedAt']),
    );
  });

  it.each([
    ['donorName', 151],
    ['donorIdentification', 51],
    ['reference', 101],
    ['description', 1001],
  ] as const)('rejects an oversized %s', async (field, length) => {
    const dto = plainToInstance(CreateDonationDto, {
      ...validDonation,
      [field]: 'x'.repeat(length),
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('accepts partial updates and keeps blank strings available to clear optional fields', async () => {
    const dto = plainToInstance(UpdateDonationDto, {
      donorName: '  ',
      amount: '500.00',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.donorName).toBe('');
  });

  it('rejects non-client properties through the global validation policy', async () => {
    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    await expect(
      pipe.transform(
        { ...validDonation, status: 'CONFIRMED' },
        { type: 'body', metatype: CreateDonationDto },
      ),
    ).rejects.toThrow();
  });
});
