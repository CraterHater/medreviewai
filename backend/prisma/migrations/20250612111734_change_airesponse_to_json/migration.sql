/*
  Warnings:

  - The `aiResponse` column on the `MedicationReview` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "MedicationReview" DROP COLUMN "aiResponse",
ADD COLUMN     "aiResponse" JSONB;
