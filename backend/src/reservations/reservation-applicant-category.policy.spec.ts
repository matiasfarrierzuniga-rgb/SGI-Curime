import {
  APPLICANT_CATEGORY_REJECTION_MESSAGES,
  RESERVATION_APPLICANT_CATEGORIES,
  evaluateApplicantCategory,
  isReservationApplicantCategory,
} from './reservation-applicant-category.policy';

const activeAffiliation = { hasPerson: true, affiliateStatus: 'ACTIVE' };
const inactiveAffiliation = { hasPerson: true, affiliateStatus: 'INACTIVE' };
const unlinkedRequester = { hasPerson: false, affiliateStatus: null };

describe('reservation applicant category policy', () => {
  it('publishes the three supported categories', () => {
    expect(RESERVATION_APPLICANT_CATEGORIES).toEqual([
      'GROUPS_COMMITTEES',
      'MEMBERS',
      'PRIVATE',
    ]);
    expect(isReservationApplicantCategory('PRIVATE')).toBe(true);
    expect(isReservationApplicantCategory('UNKNOWN')).toBe(false);
  });

  it('allows private requests for any authenticated requester', () => {
    expect(evaluateApplicantCategory('PRIVATE', unlinkedRequester)).toEqual({
      allowed: true,
      category: 'PRIVATE',
    });
    expect(evaluateApplicantCategory('PRIVATE', activeAffiliation)).toEqual({
      allowed: true,
      category: 'PRIVATE',
    });
    expect(evaluateApplicantCategory('PRIVATE', inactiveAffiliation)).toEqual({
      allowed: true,
      category: 'PRIVATE',
    });
  });

  it('allows member requests only with an active affiliation linked to the requester', () => {
    expect(evaluateApplicantCategory('MEMBERS', activeAffiliation)).toEqual({
      allowed: true,
      category: 'MEMBERS',
    });
  });

  it.each([
    ['no linked identity', unlinkedRequester],
    ['inactive affiliation', inactiveAffiliation],
  ])('rejects member requests with %s', (_label, affiliation) => {
    expect(evaluateApplicantCategory('MEMBERS', affiliation)).toEqual({
      allowed: false,
      reason: 'MEMBERS_REQUIRES_ACTIVE_AFFILIATION',
    });
  });

  it('rejects group and committee requests until an institutional rule exists', () => {
    expect(
      evaluateApplicantCategory('GROUPS_COMMITTEES', activeAffiliation),
    ).toEqual({
      allowed: false,
      reason: 'GROUPS_COMMITTEES_NOT_AVAILABLE',
    });
    expect(
      evaluateApplicantCategory('GROUPS_COMMITTEES', unlinkedRequester),
    ).toEqual({
      allowed: false,
      reason: 'GROUPS_COMMITTEES_NOT_AVAILABLE',
    });
  });

  it('rejects unknown categories', () => {
    expect(evaluateApplicantCategory('SOCIOS', activeAffiliation)).toEqual({
      allowed: false,
      reason: 'UNKNOWN_CATEGORY',
    });
  });

  it('never discloses the affiliation state of the requester', () => {
    const messages = Object.values(APPLICANT_CATEGORY_REJECTION_MESSAGES);
    expect(messages).toHaveLength(3);
    for (const message of messages) {
      expect(message).not.toMatch(/afiliad|activo|inactivo|padrón|vinculad/i);
    }
  });
});
