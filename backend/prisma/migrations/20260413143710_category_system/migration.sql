/*
  Warnings:

  - You are about to drop the column `explanation` on the `Question` table. All the data in the column will be lost.
  - Added the required column `category` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `Test` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalMarks` to the `Test` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Question" DROP COLUMN "explanation",
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "marks" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "optionA" DROP NOT NULL,
ALTER COLUMN "optionB" DROP NOT NULL,
ALTER COLUMN "optionC" DROP NOT NULL,
ALTER COLUMN "optionD" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "totalMarks" INTEGER NOT NULL;
