import { CAPABILITIES_KEY } from '../auth/presentation/decorators/require-capabilities.decorator';
import { CAPABILITY_BY_BODY_VALUE_KEY } from '../auth/presentation/decorators/require-capability-by-body-value.decorator';
import { AbsenceJustificationsController } from './absence-justifications.controller';

describe('AbsenceJustificationsController capability contracts', () => {
  const controller = new AbsenceJustificationsController({} as never);

  it.each([
    ['findAll', ['adm.justifications.read']],
    ['findOne', ['adm.justifications.read']],
    ['approve', ['adm.justifications.approve']],
    ['reject', ['adm.justifications.reject']],
  ] as const)('%s uses canonical justification capabilities', (handler, codes) => {
    expect(
      Reflect.getMetadata(
        CAPABILITIES_KEY,
        AbsenceJustificationsController.prototype[handler],
      ),
    ).toEqual(codes);
  });

  it('requires exact persisted capability for generic decisions', () => {
    expect(
      Reflect.getMetadata(
        CAPABILITY_BY_BODY_VALUE_KEY,
        AbsenceJustificationsController.prototype.decide,
      ),
    ).toEqual({
      field: 'status',
      capabilities: {
        APPROVED: 'adm.justifications.approve',
        REJECTED: 'adm.justifications.reject',
      },
    });
  });
});
