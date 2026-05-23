/*
  Warnings:

  - Added the required column `xpEarned` to the `Result` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_jobId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_userId_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_recruiterId_fkey";

-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_userId_fkey";

-- DropForeignKey
ALTER TABLE "Recruiter" DROP CONSTRAINT "Recruiter_userId_fkey";

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "difficulty" TEXT NOT NULL DEFAULT 'easy',
ADD COLUMN     "level" TEXT NOT NULL DEFAULT 'Beginner';

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "explanation" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'mcq';

-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "xpEarned" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "level" TEXT NOT NULL DEFAULT 'Beginner',
ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recruiter" ADD CONSTRAINT "Recruiter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "Recruiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
