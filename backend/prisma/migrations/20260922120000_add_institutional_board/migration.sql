CREATE TYPE "BoardPosition" AS ENUM ('PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER', 'VOCAL', 'FISCAL', 'SUPLENTE');

CREATE TABLE "BoardTerm" (
    "id" SERIAL NOT NULL,
    "institutionalProfileId" INTEGER NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BoardTerm_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BoardTerm_dates_check" CHECK ("startsOn" <= "endsOn")
);

CREATE TABLE "BoardAppointment" (
    "id" SERIAL NOT NULL,
    "boardTermId" INTEGER NOT NULL,
    "personId" INTEGER NOT NULL,
    "position" "BoardPosition" NOT NULL,
    "seatNumber" INTEGER,
    "startsOn" DATE,
    "endsOn" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BoardAppointment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BoardAppointment_seat_number_check" CHECK ("seatNumber" IS NULL OR "seatNumber" > 0),
    CONSTRAINT "BoardAppointment_dates_check" CHECK ("startsOn" IS NULL OR "endsOn" IS NULL OR "startsOn" <= "endsOn")
);

CREATE INDEX "BoardTerm_institutionalProfileId_startsOn_idx" ON "BoardTerm"("institutionalProfileId", "startsOn");
CREATE INDEX "BoardAppointment_boardTermId_idx" ON "BoardAppointment"("boardTermId");
CREATE INDEX "BoardAppointment_personId_idx" ON "BoardAppointment"("personId");
CREATE INDEX "BoardAppointment_position_seatNumber_idx" ON "BoardAppointment"("position", "seatNumber");
ALTER TABLE "BoardTerm" ADD CONSTRAINT "BoardTerm_institutionalProfileId_fkey" FOREIGN KEY ("institutionalProfileId") REFERENCES "InstitutionalProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BoardAppointment" ADD CONSTRAINT "BoardAppointment_boardTermId_fkey" FOREIGN KEY ("boardTermId") REFERENCES "BoardTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BoardAppointment" ADD CONSTRAINT "BoardAppointment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
