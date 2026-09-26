import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PREFLIGHT_STATES,
  buildAbortReasons,
  classifyPreflightState,
  compareInstitutionalRoots,
} from './reconcile-organization-profile-preflight-lib.mjs';

test('classifies all six supported preflight states', () => {
  assert.equal(
    classifyPreflightState({
      historySupported: true,
      physicalSupported: true,
      legacyPresent: true,
      canonicalPresent: false,
      rootsEquivalent: true,
    }),
    PREFLIGHT_STATES.MAIN_LEGACY_ONLY,
  );

  assert.equal(
    classifyPreflightState({
      historySupported: true,
      physicalSupported: true,
      legacyPresent: false,
      canonicalPresent: true,
      rootsEquivalent: true,
    }),
    PREFLIGHT_STATES.CANONICAL_ONLY,
  );

  assert.equal(
    classifyPreflightState({
      historySupported: true,
      physicalSupported: true,
      legacyPresent: true,
      canonicalPresent: true,
      rootsEquivalent: true,
    }),
    PREFLIGHT_STATES.BOTH_EQUIVALENT,
  );

  assert.equal(
    classifyPreflightState({
      historySupported: true,
      physicalSupported: true,
      legacyPresent: true,
      canonicalPresent: true,
      rootsEquivalent: false,
    }),
    PREFLIGHT_STATES.BOTH_CONFLICTING,
  );

  assert.equal(
    classifyPreflightState({
      historySupported: true,
      physicalSupported: true,
      legacyPresent: false,
      canonicalPresent: false,
      rootsEquivalent: true,
    }),
    PREFLIGHT_STATES.NEITHER,
  );

  assert.equal(
    classifyPreflightState({
      historySupported: false,
      physicalSupported: true,
      legacyPresent: true,
      canonicalPresent: false,
      rootsEquivalent: true,
    }),
    PREFLIGHT_STATES.HISTORY_MISMATCH,
  );
});

test('physical mismatch overrides table topology as HISTORY_MISMATCH', () => {
  assert.equal(
    classifyPreflightState({
      historySupported: true,
      physicalSupported: false,
      legacyPresent: true,
      canonicalPresent: true,
      rootsEquivalent: true,
    }),
    PREFLIGHT_STATES.HISTORY_MISMATCH,
  );
});

test('compares dual roots without returning institutional values', () => {
  const sensitiveName = 'Sensitive institutional name';
  const result = compareInstitutionalRoots(
    {
      legalName: sensitiveName,
      legalIdentification: 'legacy-id',
      dinadecoRegistrationCode: null,
      dinadecoRegion: 'Region 1',
      organizationType: 'INTEGRAL',
      province: 'Guanacaste',
      canton: 'Nicoya',
      district: 'Curime',
      correspondenceAddress: 'Address A',
      phone: '1111',
      telefax: null,
      email: 'legacy@example.invalid',
    },
    {
      legalName: sensitiveName,
      legalIdentification: 'different-id',
      dinadecoRegistrationCode: null,
      region: 'Region 1',
      organizationType: 'Asociación de Desarrollo Integral',
      province: 'Guanacaste',
      canton: 'Nicoya',
      district: 'Curime',
      physicalAddress: 'Address A',
      notificationPhone: '1111',
      notificationFax: null,
      notificationEmail: 'canonical@example.invalid',
    },
  );

  assert.equal(result.equivalent, false);
  assert.deepEqual(result.conflictingFields, [
    'legalIdentification',
    'notificationEmail',
  ]);
  assert.equal(JSON.stringify(result).includes(sensitiveName), false);
  assert.equal(JSON.stringify(result).includes('legacy-id'), false);
});

test('defines abort behavior required by task 1.5', () => {
  const reasons = buildAbortReasons({
    classification: PREFLIGHT_STATES.HISTORY_MISMATCH,
    multipleSingletonRows: true,
    invalidSingletonIdentity: true,
    environmentOwnershipDeclared: false,
    authoritativeConfigurationAvailable: false,
    boardForeignKeySupported: false,
  });

  assert.deepEqual(reasons, [
    'UNSUPPORTED_MIGRATION_OR_PHYSICAL_STATE',
    'MULTIPLE_SINGLETON_ROWS',
    'INVALID_SINGLETON_IDENTITY',
    'UNKNOWN_ENVIRONMENT_OWNERSHIP',
    'AUTHORITATIVE_CONFIGURATION_UNAVAILABLE',
    'BOARD_FOREIGN_KEY_UNSUPPORTED',
  ]);
});

test('conflicting roots block without choosing a winner', () => {
  const reasons = buildAbortReasons({
    classification: PREFLIGHT_STATES.BOTH_CONFLICTING,
    multipleSingletonRows: false,
    invalidSingletonIdentity: false,
    environmentOwnershipDeclared: true,
    authoritativeConfigurationAvailable: true,
    boardForeignKeySupported: true,
  });

  assert.deepEqual(reasons, ['CONFLICTING_ROOTS']);
});
