# Consolidated Target Master ERD v1

**Status:** TARGET FROZEN. This is canonical global architecture view for the
consolidated Target Relational Model v1. It is not current Prisma or a
migration specification.

`TARGET_PERSISTENT_ENTITIES=40`
`TRANSITIONAL_ENTITIES=1`
`MASTER_RELATIONSHIPS=61`

```mermaid
erDiagram
    OrganizationProfile {
        int id PK
        string legalIdentification
        string dinadecoRegistrationCode
    }
    Person {
        int id PK
        string normalizedIdentification
    }
    Role {
        int id PK
        string name UK
    }
    Permission {
        int id PK
        string code UK
    }
    RolePermission {
        int roleId PK, FK
        int permissionId PK, FK
    }
    User {
        int id PK
        int personId FK, UK
        int roleId FK
        string email UK
    }
    Session {
        int id PK
        int userId FK
        string refreshTokenHash UK
    }
    AuditLog {
        int id PK
        int userId FK
    }
    PasswordResetToken {
        int id PK
        int userId FK
        string tokenHash UK
    }
    AccountActivationToken {
        int id PK
        int userId FK
        string tokenHash UK
    }
    UserRequest {
        int id PK
        int reviewedById FK
        int personId FK
    }
    Affiliate {
        int id PK
        int personId FK, UK
    }
    AffiliateRequest {
        int id PK
        int reviewedById FK
        int personId FK
    }
    AffiliateSanction {
        int id PK
        int affiliateId FK
        int createdById FK
    }
    GovernancePosition {
        int id PK
        string code UK
    }
    GovernanceTerm {
        int id PK
        string status
    }
    GovernanceMembership {
        int id PK
        int termId FK
        int positionId FK
        int affiliateId FK
        int seatNumber
        int appointedByAssemblyId FK
    }
    Assembly {
        int id PK
    }
    AssemblyCall {
        int id PK
        int assemblyId FK
        int callNumber
    }
    AssemblyConvocation {
        int id PK
        int assemblyId FK
        int affiliateId FK
        int governanceMembershipId FK
    }
    AssemblyAttendance {
        int id PK
        int convocationId FK, UK
    }
    AbsenceJustification {
        int id PK
        int attendanceId FK, UK
        int reviewedById FK
    }
    AssemblyMinute {
        int id PK
        int assemblyId FK, UK
    }
    AssemblyResolution {
        int id PK
        int assemblyId FK
    }
    Event {
        int id PK
        uuid publicId UK
    }
    ReservableResource {
        int id PK
    }
    Reservation {
        int id PK
        int resourceId FK
        int requesterUserId FK
        int approvedById FK
        int eventId FK
    }
    FinancialAccount {
        int id PK
        string code UK
    }
    FinancialCharge {
        int id PK
        int reservationId FK, UK
    }
    Payment {
        int id PK
        int chargeId FK
        int movementId FK, UK
        int recordedById FK
    }
    FinancialMovement {
        int id PK
        int accountId FK
        int recordedById FK
        int reversalOfId FK, UK
        int voidedById FK
    }
    Donation {
        int id PK
        int donorPersonId FK
        int recordedById FK
        int cancelledById FK
        int originalMovementId FK, UK
    }
    Expense {
        int id PK
        int authorizationResolutionId FK
    }
    ExpenseDocument {
        int id PK
        int expenseId FK
    }
    Disbursement {
        int id PK
        int expenseId FK
        int movementId FK, UK
    }
    FundingAllocation {
        int id PK
        int expenseId FK
        int incomeMovementId FK
    }
    InventoryCategory {
        int id PK
        string name UK
    }
    InventoryItem {
        int id PK
        string code UK
        int categoryId FK
    }
    InventoryMovement {
        int id PK
        int itemId FK
        int createdById FK
        int quantityDelta
    }
    InventoryLoan {
        int id PK
        int itemId FK
        int borrowerAffiliateId FK
        int createdById FK
        int receivedById FK
        int cancelledById FK
        int checkoutMovementId FK, UK
        int returnMovementId FK, UK
        int cancellationMovementId FK, UK
    }

    Person o|--|| User : has_access_account
    Role ||--o{ User : authorizes
    Role ||--o{ RolePermission : grants
    Permission ||--o{ RolePermission : assigned_to
    User ||--o{ Session : owns
    User o|--o{ AuditLog : acts_in
    User ||--o{ PasswordResetToken : receives
    User ||--o{ AccountActivationToken : receives
    User o|--o{ UserRequest : reviews
    Person o|--o{ UserRequest : reconciles
    Person o|--|| Affiliate : has_affiliation
    User o|--o{ AffiliateRequest : reviews
    Person o|--o{ AffiliateRequest : reconciles
    Affiliate ||--o{ AffiliateSanction : receives
    User ||--o{ AffiliateSanction : creates
    GovernanceTerm ||--o{ GovernanceMembership : contains
    GovernancePosition ||--o{ GovernanceMembership : defines
    Affiliate ||--o{ GovernanceMembership : holds
    Assembly o|--o{ GovernanceMembership : appoints
    Assembly ||--o{ AssemblyCall : schedules
    Assembly ||--o{ AssemblyConvocation : convenes
    Affiliate ||--o{ AssemblyConvocation : is_invited
    GovernanceMembership o|--o{ AssemblyConvocation : snapshots
    AssemblyConvocation ||--o| AssemblyAttendance : records
    AssemblyAttendance ||--o| AbsenceJustification : supports
    User o|--o{ AbsenceJustification : reviews
    Assembly ||--o| AssemblyMinute : records
    Assembly ||--o{ AssemblyResolution : adopts
    ReservableResource ||--o{ Reservation : is_reserved
    User ||--o{ Reservation : requests
    User o|--o{ Reservation : approves
    Event o|--o{ Reservation : groups
    Reservation ||--o| FinancialCharge : creates
    FinancialCharge ||--o{ Payment : receives
    FinancialMovement ||--o| Payment : evidences
    User o|--o{ Payment : records
    FinancialAccount ||--o{ FinancialMovement : contains
    User ||--o{ FinancialMovement : records
    FinancialMovement o|--o| FinancialMovement : reverses
    User o|--o{ FinancialMovement : voids
    Person o|--o{ Donation : donates
    User ||--o{ Donation : records
    User o|--o{ Donation : cancels
    FinancialMovement ||--o| Donation : is_original_for
    AssemblyResolution o|--o{ Expense : authorizes
    Expense ||--o{ ExpenseDocument : proves
    Expense ||--o{ Disbursement : executes
    FinancialMovement ||--o| Disbursement : evidences
    Expense ||--o{ FundingAllocation : receives
    FinancialMovement o|--o{ FundingAllocation : funds
    InventoryCategory ||--o{ InventoryItem : classifies
    InventoryItem ||--o{ InventoryMovement : changes
    User o|--o{ InventoryMovement : creates
    InventoryItem ||--o{ InventoryLoan : is_loaned
    Affiliate o|--o{ InventoryLoan : borrows
    User o|--o{ InventoryLoan : creates
    User o|--o{ InventoryLoan : receives
    User o|--o{ InventoryLoan : cancels
    InventoryMovement o|--o| InventoryLoan : checkout_evidence
    InventoryMovement o|--o| InventoryLoan : return_evidence
    InventoryMovement o|--o| InventoryLoan : cancellation_evidence
```

## Transitional infrastructure

```mermaid
erDiagram
    Person {
        int id PK
    }
    IdentityReconciliationManifest {
        int id PK
        int selectedPersonId FK
        string classification
    }

    Person o|--o{ IdentityReconciliationManifest : selected_for_reconciliation
```

`IdentityReconciliationManifest` is TRANSITIONAL and not one of the 40.

## Diagram notes

- `GovernanceMembership.seatNumber` is nullable; active-seat uniqueness applies
  only when it is present.
- `AssemblyMinute.assemblyId` is required unique: Assembly `1 -> 0..1`
  AssemblyMinute.
- `FundingAllocation.incomeMovementId` is nullable and non-unique. Aggregate
  availability constraints are documented in the consolidated model/dictionary.
- Mermaid does not encode singleton enforcement, aggregate allocation caps,
  transition gates, or cross-row movement compatibility.
