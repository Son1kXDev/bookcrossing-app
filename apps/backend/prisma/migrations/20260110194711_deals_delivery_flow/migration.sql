-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DealStatus" ADD VALUE 'pickup_selected';
ALTER TYPE "DealStatus" ADD VALUE 'shipped';

-- AlterTable
ALTER TABLE "deals" ADD COLUMN     "accepted_at" TIMESTAMP(3),
ADD COLUMN     "buyer_received_at" TIMESTAMP(3),
ADD COLUMN     "pickup_point_id" TEXT,
ADD COLUMN     "seller_shipped_at" TIMESTAMP(3),
ADD COLUMN     "tracking_number" TEXT;
