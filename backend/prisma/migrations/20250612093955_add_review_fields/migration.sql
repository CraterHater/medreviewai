/*
  Warnings:

  - You are about to drop the column `content` on the `MedicationReview` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "MedicationReview" DROP CONSTRAINT "MedicationReview_userId_fkey";

-- AlterTable
ALTER TABLE "MedicationReview" DROP COLUMN "content",
ADD COLUMN     "history" TEXT,
ADD COLUMN     "labData" TEXT,
ADD COLUMN     "medication" TEXT,
ADD COLUMN     "vitalData" TEXT;

-- AddForeignKey
ALTER TABLE "MedicationReview" ADD CONSTRAINT "MedicationReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
