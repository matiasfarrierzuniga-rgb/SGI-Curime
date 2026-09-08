-- Add decision and evidence metadata without changing existing justifications.
ALTER TABLE "AbsenceJustification"
  ADD COLUMN "decisionNote" TEXT,
  ADD COLUMN "attachmentOriginalName" TEXT,
  ADD COLUMN "attachmentMimeType" TEXT,
  ADD COLUMN "attachmentSize" INTEGER,
  ADD COLUMN "attachmentUrl" TEXT;