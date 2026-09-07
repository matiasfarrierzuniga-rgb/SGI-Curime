ALTER TABLE "AbsenceJustification"
  ADD CONSTRAINT "AbsenceJustification_assemblyId_affiliateId_fkey"
  FOREIGN KEY ("assemblyId", "affiliateId")
  REFERENCES "AssemblyAttendance"("assemblyId", "affiliateId")
  ON DELETE CASCADE ON UPDATE CASCADE;