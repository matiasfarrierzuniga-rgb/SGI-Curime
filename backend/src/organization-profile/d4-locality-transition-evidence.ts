export interface D4LocalityTransitionEvidence {
  locality: string;
}

/**
 * Extracts only meaningful legacy locality evidence. No address or district
 * mapping is derived from locality.
 */
export function extractD4LocalityTransitionEvidence(
  locality: string | null,
): D4LocalityTransitionEvidence | null {
  if (typeof locality !== 'string' || locality.trim().length === 0) {
    return null;
  }

  return { locality };
}
