ALTER TABLE "Reservation"
  ADD COLUMN "activity" TEXT,
  ADD COLUMN "applicantCategory" TEXT,
  ADD COLUMN "tariffAmount" DECIMAL(14,2);

INSERT INTO "ReservableResource" (
  "name", "description", "location", "capacity", "status", "price",
  "currency", "pricingType", "createdAt", "updatedAt"
)
SELECT
  'Play de los niños', 'Área de juegos infantiles', NULL, NULL,
  'ACTIVE'::"ReservableResourceStatus", NULL, 'CRC',
  'FREE'::"ResourcePricingType", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "ReservableResource" WHERE lower(btrim("name")) = lower('Play de los niños')
);