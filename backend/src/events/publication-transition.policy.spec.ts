import { BadRequestException } from '@nestjs/common';
import { PublicationStatus } from '../../generated/prisma/enums';
import { assertPublicationTransition } from './publication-transition.policy';

describe('publication transition policy', () => {
  it.each([
    [PublicationStatus.DRAFT, PublicationStatus.REVIEW],
    [PublicationStatus.REVIEW, PublicationStatus.DRAFT],
    [PublicationStatus.REVIEW, PublicationStatus.PUBLISHED],
    [PublicationStatus.PUBLISHED, PublicationStatus.ARCHIVED],
  ])('allows %s to %s', (from, to) => {
    expect(() => assertPublicationTransition(from, to)).not.toThrow();
  });

  it.each([
    [PublicationStatus.INTERNAL, PublicationStatus.DRAFT],
    [PublicationStatus.DRAFT, PublicationStatus.PUBLISHED],
    [PublicationStatus.REVIEW, PublicationStatus.ARCHIVED],
    [PublicationStatus.PUBLISHED, PublicationStatus.REVIEW],
    [PublicationStatus.ARCHIVED, PublicationStatus.PUBLISHED],
    ['UNKNOWN' as PublicationStatus, PublicationStatus.DRAFT],
  ])('denies %s to %s by default', (from, to) => {
    expect(() => assertPublicationTransition(from, to)).toThrow(
      BadRequestException,
    );
  });
});
