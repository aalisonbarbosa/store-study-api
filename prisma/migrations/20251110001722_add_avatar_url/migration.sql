-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT;
