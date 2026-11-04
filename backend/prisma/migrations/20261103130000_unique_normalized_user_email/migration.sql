-- Preflight required: resolve existing case/whitespace duplicates before deployment.
-- No existing values or rows are changed by this migration.
CREATE UNIQUE INDEX "User_email_normalized_key" ON "User" (lower(btrim("email")));
