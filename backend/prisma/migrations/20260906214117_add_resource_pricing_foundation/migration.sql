-- CreateEnum
CREATE TYPE "ResourcePricingType" AS ENUM ('FREE', 'FIXED');

-- AlterTable
ALTER TABLE "ReservableResource" ADD COLUMN     "price" DECIMAL(14,2),
ADD COLUMN     "pricingType" "ResourcePricingType" NOT NULL DEFAULT 'FREE';
