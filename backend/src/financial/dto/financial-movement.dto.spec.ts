import { ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FinancialMovementType } from '../../../generated/prisma/enums';
import { CreateFinancialMovementDto } from './create-financial-movement.dto';
import { QueryFinancialMovementsDto } from './query-financial-movements.dto';

describe('Financial movement DTOs', () => {
  const validMovement = {
    type: FinancialMovementType.INCOME,
    amount: '1250.50',
    description: 'Donación comunal',
    occurredAt: '2026-09-06T14:30:00.000Z',
  };

  it('accepts and normalizes a valid financial movement', async () => {
    const dto = plainToInstance(CreateFinancialMovementDto, {
      ...validMovement,
      description: '  Donación comunal  ',
      reference: '  REC-001  ',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.description).toBe('Donación comunal');
    expect(dto.reference).toBe('REC-001');
  });

  it.each(['0', '0.00', '-1', '1.234', '01.00', 'not-a-number'])(
    'rejects invalid amount %s',
    async (amount) => {
      const dto = plainToInstance(CreateFinancialMovementDto, {
        ...validMovement,
        amount,
      });

      expect(await validate(dto)).not.toHaveLength(0);
    },
  );

  it('rejects invalid types, blank descriptions and invalid dates', async () => {
    const dto = plainToInstance(CreateFinancialMovementDto, {
      ...validMovement,
      type: 'TRANSFER',
      description: '   ',
      occurredAt: 'not-a-date',
    });

    const errors = await validate(dto);
    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['type', 'description', 'occurredAt']),
    );
  });

  it.each(['currency', 'source', 'sourceId', 'recordedById'])(
    'rejects the non-client field %s through the global validation policy',
    async (field) => {
      const pipe = new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      await expect(
        pipe.transform(
          { ...validMovement, [field]: 'forbidden' },
          { type: 'body', metatype: CreateFinancialMovementDto },
        ),
      ).rejects.toThrow();
    },
  );

  it('applies query defaults and transforms numeric pagination', async () => {
    const pipe = new ValidationPipe({ transform: true, whitelist: true });
    const defaults = await pipe.transform(
      {},
      { type: 'query', metatype: QueryFinancialMovementsDto },
    );
    const explicit = await pipe.transform(
      { page: '2', limit: '100', type: 'EXPENSE' },
      { type: 'query', metatype: QueryFinancialMovementsDto },
    );

    expect(defaults).toMatchObject({ page: 1, limit: 20 });
    expect(explicit).toMatchObject({
      page: 2,
      limit: 100,
      type: FinancialMovementType.EXPENSE,
    });
  });

  it.each([
    { dateFrom: 'invalid' },
    { dateTo: '2026-13-01' },
    { page: '0' },
    { limit: '101' },
  ])('rejects invalid query values %#', async (input) => {
    const dto = plainToInstance(QueryFinancialMovementsDto, input);
    expect(await validate(dto)).not.toHaveLength(0);
  });
});
