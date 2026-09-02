import {
  buildManualReconciliationPlan,
  isCurrentConfirmationFingerprint,
  isCurrentSourceFingerprint,
  parseManualReconciliationArgs,
  safeManualPlanReport,
  type ManualLegacyUser,
  type ManualPersonCandidate,
  type ManualReconciliationInput,
} from './manual-legacy-user-reconciliation';

const input = (
  overrides: Partial<ManualReconciliationInput> = {},
): ManualReconciliationInput => ({
  userId: 7,
  identificationType: 'NATIONAL',
  firstName: 'Test',
  firstSurname: 'Identity',
  secondSurname: 'Record',
  apply: false,
  confirmUserId: null,
  expectedSourceFingerprint: null,
  expectedConfirmationFingerprint: null,
  ...overrides,
});

const user = (overrides: Partial<ManualLegacyUser> = {}): ManualLegacyUser => ({
  sourceModel: 'User',
  sourceId: 7,
  personId: null,
  identification: '123456789',
  identificationType: null,
  fullName: 'Legacy Display Name',
  birthDate: null,
  email: 'account@example.test',
  phoneCountryCode: null,
  phoneNationalNumber: null,
  address: null,
  ...overrides,
});

const person = (
  overrides: Partial<ManualPersonCandidate> = {},
): ManualPersonCandidate => ({
  id: 11,
  identification: '123456789',
  identificationType: 'NATIONAL',
  normalizedIdentification: '123456789',
  firstName: 'Test',
  firstSurname: 'Identity',
  secondSurname: 'Record',
  linkedUserId: null,
  ...overrides,
});

const requiredArgs = [
  '--user-id=7',
  '--identification-type=NATIONAL',
  '--first-name=Test',
  '--first-surname=Identity',
  '--second-surname=Record',
];

describe('manual legacy User reconciliation', () => {
  it('aborts when --user-id is missing', () => {
    expect(() => parseManualReconciliationArgs(requiredArgs.slice(1))).toThrow(
      '--user-id',
    );
  });

  it.each(['--first-name', '--first-surname', '--second-surname'])(
    'aborts when confirmed name component %s is missing',
    (option) => {
      expect(() =>
        parseManualReconciliationArgs(
          requiredArgs.filter((argument) => !argument.startsWith(option)),
        ),
      ).toThrow(option);
    },
  );

  it('aborts unsupported identification types', () => {
    expect(() =>
      parseManualReconciliationArgs(
        requiredArgs.map((argument) =>
          argument === '--identification-type=NATIONAL'
            ? '--identification-type=DIMEX'
            : argument,
        ),
      ),
    ).toThrow('NATIONAL');
  });

  it('requires target confirmation and source fingerprint for apply', () => {
    expect(() =>
      parseManualReconciliationArgs([...requiredArgs, '--apply']),
    ).toThrow('--confirm-user-id');
    expect(() =>
      parseManualReconciliationArgs([
        ...requiredArgs,
        '--apply',
        '--confirm-user-id=7',
      ]),
    ).toThrow('--source-fingerprint');
    expect(() =>
      parseManualReconciliationArgs([
        ...requiredArgs,
        '--apply',
        '--confirm-user-id=7',
        '--source-fingerprint=fingerprint',
      ]),
    ).toThrow('--confirmation-fingerprint');
  });

  it('aborts a missing User', () => {
    expect(buildManualReconciliationPlan(null, [], input())).toMatchObject({
      status: 'BLOCKED',
      reason: 'TARGET_USER_NOT_FOUND',
    });
  });

  it('aborts when User identification is missing', () => {
    expect(
      buildManualReconciliationPlan(user({ identification: '' }), [], input()),
    ).toMatchObject({ status: 'BLOCKED', reason: 'IDENTIFICATION_MISSING' });
  });

  it('aborts invalid NATIONAL normalization', () => {
    expect(
      buildManualReconciliationPlan(
        user({ identification: 'invalid' }),
        [],
        input(),
      ),
    ).toMatchObject({ status: 'BLOCKED', reason: 'NORMALIZATION_INVALID' });
  });

  it('plans Person creation for zero matches without parsing fullName', () => {
    const plan = buildManualReconciliationPlan(user(), [], input());
    expect(plan).toMatchObject({
      status: 'READY_TO_CREATE',
      personCreationRequired: true,
      matchingPersonCount: 0,
    });
    expect(JSON.stringify(plan)).not.toContain('Legacy Display Name');
  });

  it('plans reuse for one compatible Person', () => {
    expect(
      buildManualReconciliationPlan(user(), [person()], input()),
    ).toMatchObject({
      status: 'READY_TO_REUSE',
      selectedPersonId: 11,
      compatiblePersonFound: true,
    });
  });

  it('accepts absent structured fields without mutating the Person', () => {
    expect(
      buildManualReconciliationPlan(
        user(),
        [person({ firstName: null, firstSurname: null, secondSurname: null })],
        input(),
      ).status,
    ).toBe('READY_TO_REUSE');
  });

  it('aborts an incompatible Person', () => {
    expect(
      buildManualReconciliationPlan(
        user(),
        [person({ firstName: 'Different' })],
        input(),
      ),
    ).toMatchObject({
      status: 'BLOCKED',
      reason: 'PERSON_STRUCTURED_IDENTITY_CONFLICT',
    });
  });

  it('aborts a raw-identification Person with incomplete identity key', () => {
    expect(
      buildManualReconciliationPlan(
        user(),
        [
          person({
            identificationType: null,
            normalizedIdentification: null,
          }),
        ],
        input(),
      ),
    ).toMatchObject({
      status: 'BLOCKED',
      reason: 'RAW_IDENTIFICATION_PERSON_CONFLICT',
    });
  });

  it('aborts multiple matching Persons', () => {
    expect(
      buildManualReconciliationPlan(
        user(),
        [person(), person({ id: 12 })],
        input(),
      ),
    ).toMatchObject({ status: 'BLOCKED', reason: 'MULTIPLE_PERSON_MATCHES' });
  });

  it('recognizes an already correct link as idempotent success', () => {
    expect(
      buildManualReconciliationPlan(
        user({ personId: 11 }),
        [person()],
        input(),
      ),
    ).toMatchObject({
      status: 'ALREADY_RECONCILED',
      writeRequired: false,
      applySafe: true,
    });
  });

  it('aborts an incompatible existing User link', () => {
    expect(
      buildManualReconciliationPlan(
        user({ personId: 12 }),
        [
          person(),
          person({
            id: 12,
            identification: '987654321',
            normalizedIdentification: '987654321',
          }),
        ],
        input(),
      ),
    ).toMatchObject({ status: 'BLOCKED', reason: 'USER_LINK_CONFLICT' });
  });

  it('aborts when matching Person belongs to another User', () => {
    expect(
      buildManualReconciliationPlan(
        user(),
        [person({ linkedUserId: 99 })],
        input(),
      ),
    ).toMatchObject({
      status: 'BLOCKED',
      reason: 'PERSON_ALREADY_OWNED_BY_ANOTHER_USER',
    });
  });

  it('detects stale source state', () => {
    const before = buildManualReconciliationPlan(user(), [], input());
    const after = buildManualReconciliationPlan(
      user({ fullName: 'Changed source' }),
      [],
      input(),
    );
    expect(isCurrentSourceFingerprint(after, before.sourceFingerprint)).toBe(
      false,
    );
  });

  it('binds confirmed identity input to confirmation fingerprint', () => {
    const before = buildManualReconciliationPlan(user(), [], input());
    const changed = buildManualReconciliationPlan(
      user(),
      [],
      input({ firstName: 'Changed' }),
    );
    expect(
      isCurrentConfirmationFingerprint(changed, before.confirmationFingerprint),
    ).toBe(false);
  });

  it('does not expose raw identification in report output', () => {
    const report = safeManualPlanReport(
      buildManualReconciliationPlan(user(), [], input()),
    );
    expect(JSON.stringify(report)).not.toContain(user().identification);
  });
});
