# Spec Delta

## ADDED Requirements

### Requirement: Community account remains independent from affiliation
The system SHALL keep a verified community account independent from the Affiliate Request workflow and SHALL not grant affiliate status through registration, email verification, or community-account sign-in.

#### Scenario: Community account holder requests affiliation
- **WHEN** a verified community account holder starts an affiliation process
- **THEN** the affiliation request follows its existing independent review and approval lifecycle

#### Scenario: Community account holder has no affiliation
- **WHEN** a verified community account holder has no approved affiliation
- **THEN** the account remains authenticated only with its community access and no affiliate status is created
