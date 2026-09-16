import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryDinadecoAnnualReportDto } from './query-dinadeco-annual-report.dto';

describe('QueryDinadecoAnnualReportDto', () => {
  it('accepts a valid four-digit year and transforms it to an integer', async () => {
    const dto = plainToInstance(QueryDinadecoAnnualReportDto, { year: '2026' });
    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.year).toBe(2026);
  });

  it.each(['invalid', '2026.5', '999', '02026', '2e3', '2101', ''])('rejects invalid year %p', async (year) => {
    const dto = plainToInstance(QueryDinadecoAnnualReportDto, { year });
    expect(await validate(dto)).not.toHaveLength(0);
  });
});
