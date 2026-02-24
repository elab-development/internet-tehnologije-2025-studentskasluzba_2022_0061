/*
  Warnings:

  - Added the required column `nivoStudija` to the `PeriodZaBiranje` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PeriodZaBiranje" ADD COLUMN     "nivoStudija" "NivoStudija" NOT NULL;

-- CreateIndex
CREATE INDEX "PeriodZaBiranje_nivoStudija_idx" ON "PeriodZaBiranje"("nivoStudija");
