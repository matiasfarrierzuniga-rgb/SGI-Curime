import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { getReservationTariff } from './reservation-tariffs';

describe('reservation tariff matrix', () => {
  it.each([
    ['DANCES', 'GROUPS_COMMITTEES', 90000],
    ['DANCES', 'MEMBERS', 90000],
    ['DANCES', 'PRIVATE', 90000],
    ['SPORTS', 'GROUPS_COMMITTEES', null],
    ['SPORTS', 'MEMBERS', null],
    ['SPORTS', 'PRIVATE', null],
    ['BINGO', 'GROUPS_COMMITTEES', 40000],
    ['BINGO', 'MEMBERS', 35000],
    ['BINGO', 'PRIVATE', 50000],
    ['TEA_BASKET', 'GROUPS_COMMITTEES', null],
    ['TEA_BASKET', 'MEMBERS', 35000],
    ['TEA_BASKET', 'PRIVATE', 50000],
    ['BIRTHDAY', 'GROUPS_COMMITTEES', null],
    ['BIRTHDAY', 'MEMBERS', 35000],
    ['BIRTHDAY', 'PRIVATE', 50000],
    ['WEDDING', 'GROUPS_COMMITTEES', null],
    ['WEDDING', 'MEMBERS', 35000],
    ['WEDDING', 'PRIVATE', 50000],
    ['MOVIE', 'GROUPS_COMMITTEES', 40000],
    ['MOVIE', 'MEMBERS', null],
    ['MOVIE', 'PRIVATE', null],
    ['MOONLIGHT', 'GROUPS_COMMITTEES', 40000],
    ['MOONLIGHT', 'MEMBERS', null],
    ['MOONLIGHT', 'PRIVATE', null],
    ['TALKS', 'GROUPS_COMMITTEES', null],
    ['TALKS', 'MEMBERS', null],
    ['TALKS', 'PRIVATE', null],
  ] as const)('%s / %s → %s', (activity, category, amount) => {
    expect(getReservationTariff(activity, category)).toBe(amount);
  });

  it('rejects unknown activity and applicant category values', () => {
    expect(getReservationTariff('UNKNOWN', 'MEMBERS')).toBeNull();
    expect(getReservationTariff('DANCES', 'UNKNOWN')).toBeNull();
  });

  it('requires valid activity and applicant category values in the creation contract', async () => {
    const valid = plainToInstance(CreateReservationDto, {
      resourceId: 1,
      startAt: '2030-01-01T10:00:00.000Z',
      endAt: '2030-01-01T12:00:00.000Z',
      purpose: 'Actividad comunitaria',
      activity: 'DANCES',
      applicantCategory: 'MEMBERS',
    });
    expect(await validate(valid)).toEqual([]);
    const missing = plainToInstance(CreateReservationDto, {
      resourceId: 1,
      startAt: '2030-01-01T10:00:00.000Z',
      endAt: '2030-01-01T12:00:00.000Z',
      purpose: 'Actividad comunitaria',
    });
    expect((await validate(missing)).map(error => error.property)).toEqual(expect.arrayContaining(['activity', 'applicantCategory']));
  });
});
