-- CreateTable
CREATE TABLE "MedicationReview" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "MedicationReview_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MedicationReview" ADD CONSTRAINT "MedicationReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
