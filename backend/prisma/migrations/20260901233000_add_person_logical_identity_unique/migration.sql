-- Nullable identity fields remain transitional; PostgreSQL permits multiple NULL combinations.
CREATE UNIQUE INDEX "Person_identificationType_normalizedIdentification_key"
ON "Person"("identificationType", "normalizedIdentification");
