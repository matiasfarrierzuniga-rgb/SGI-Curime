import { extractD4LocalityTransitionEvidence } from './d4-locality-transition-evidence';

describe('D4 locality transition evidence', () => {
  it('preserves meaningful locality exactly', () => {
    expect(extractD4LocalityTransitionEvidence('  synthetic locality  ')).toEqual({
      locality: '  synthetic locality  ',
    });
  });

  it.each([null, '', '   '])('omits non-meaningful locality %p', (locality) => {
    expect(extractD4LocalityTransitionEvidence(locality)).toBeNull();
  });

  it('maps neither physical address nor district', () => {
    const evidence = extractD4LocalityTransitionEvidence('synthetic locality');

    expect(evidence).toEqual({ locality: 'synthetic locality' });
    expect(evidence).not.toHaveProperty('physicalAddress');
    expect(evidence).not.toHaveProperty('district');
  });
});
