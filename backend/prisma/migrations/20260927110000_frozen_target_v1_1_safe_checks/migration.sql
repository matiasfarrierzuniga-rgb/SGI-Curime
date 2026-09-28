-- Frozen Target V1.1 safe enforcement wave.
-- Existing-table checks are NOT VALID: they protect new writes without
-- asserting unverified brownfield history. Validation/NOT NULL cutovers are
-- deferred to explicit gate evidence and never hidden in this migration.

ALTER TABLE "User" ADD CONSTRAINT "User_failedLoginAttempts_check" CHECK ("failedLoginAttempts" >= 0) NOT VALID;
ALTER TABLE "BoardTerm" ADD CONSTRAINT "GovernanceTerm_dates_target_check" CHECK ("startsOn" < "endsOn") NOT VALID;
ALTER TABLE "BoardAppointment" ADD CONSTRAINT "GovernanceMembership_seat_target_check" CHECK ("seatNumber" IS NULL OR "seatNumber" > 0) NOT VALID;
ALTER TABLE "BoardAppointment" ADD CONSTRAINT "GovernanceMembership_dates_target_check" CHECK ("endsOn" IS NULL OR "startsOn" IS NULL OR "endsOn" >= "startsOn") NOT VALID;
CREATE UNIQUE INDEX "GovernanceMembership_active_seat_key" ON "BoardAppointment"("boardTermId", "positionId", "seatNumber") WHERE "endsOn" IS NULL AND "positionId" IS NOT NULL AND "seatNumber" IS NOT NULL;

ALTER TABLE "AbsenceJustification" ADD CONSTRAINT "AbsenceJustification_attachment_size_check" CHECK ("attachmentSize" IS NULL OR "attachmentSize" > 0) NOT VALID;
ALTER TABLE "AssemblyAttendance" ADD CONSTRAINT "AssemblyAttendance_target_status_check" CHECK ("status" IN ('PRESENT', 'ABSENT')) NOT VALID;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_dates_check" CHECK ("startAt" < "endAt") NOT VALID;
ALTER TABLE "ReservableResource" ADD CONSTRAINT "ReservableResource_pricing_check" CHECK (
  ("pricingType" = 'FREE' AND "price" IS NULL)
  OR ("pricingType" = 'FIXED' AND "price" > 0 AND "currency" = 'CRC')
) NOT VALID;
ALTER TABLE "FinancialCharge" ADD CONSTRAINT "FinancialCharge_amount_check" CHECK ("amount" > 0) NOT VALID;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_amount_check" CHECK ("amount" > 0) NOT VALID;
ALTER TABLE "FinancialMovement" ADD CONSTRAINT "FinancialMovement_amount_check" CHECK ("amount" > 0) NOT VALID;
ALTER TABLE "FinancialMovement" ADD CONSTRAINT "FinancialMovement_not_self_reversal_check" CHECK ("reversalOfId" IS NULL OR "reversalOfId" <> "id") NOT VALID;
ALTER TABLE "FinancialMovement" ADD CONSTRAINT "FinancialMovement_void_metadata_check" CHECK (
  "status" IS NULL OR "status" = 'POSTED'
  OR ("status" = 'VOIDED' AND "voidedAt" IS NOT NULL AND "voidedById" IS NOT NULL AND NULLIF(btrim("voidReason"), '') IS NOT NULL)
) NOT VALID;
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_amount_check" CHECK ("amount" > 0) NOT VALID;
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_quantities_check" CHECK ("currentQuantity" >= 0 AND "minimumQuantity" >= 0) NOT VALID;
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_delta_check" CHECK (
  "quantityDelta" IS NULL OR (
    "quantityDelta" <> 0
    AND ("type" NOT IN ('ENTRY', 'EXIT') OR ("type" = 'ENTRY' AND "quantityDelta" > 0) OR ("type" = 'EXIT' AND "quantityDelta" < 0))
  )
) NOT VALID;
ALTER TABLE "InventoryLoan" ADD CONSTRAINT "InventoryLoan_quantity_dates_check" CHECK ("quantity" > 0 AND "expectedReturnDate" > "loanDate") NOT VALID;
ALTER TABLE "InventoryLoan" ADD CONSTRAINT "InventoryLoan_status_evidence_check" CHECK (
  ("status" = 'ACTIVE' AND "returnedAt" IS NULL AND "cancelledAt" IS NULL)
  OR ("status" = 'RETURNED' AND "returnedAt" IS NOT NULL AND "cancelledAt" IS NULL)
  OR ("status" = 'CANCELLED' AND "cancelledAt" IS NOT NULL AND "returnedAt" IS NULL)
) NOT VALID;
