/*
  Warnings:

  - The `skills` column on the `Profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `totalMarks` on the `Test` table. All the data in the column will be lost.
  - Changed the type of `role` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'candidate', 'recruiter');

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "skills",
ADD COLUMN     "skills" TEXT[];

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "codeTemplate" TEXT,
ADD COLUMN     "difficulty" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN     "expectedOutput" TEXT,
ADD COLUMN     "explanation" TEXT,
ALTER COLUMN "testId" DROP NOT NULL,
ALTER COLUMN "category" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "answers" JSONB;

-- AlterTable
ALTER TABLE "Test" DROP COLUMN "totalMarks",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL;
