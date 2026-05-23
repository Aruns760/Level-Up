/*
  Warnings:

  - Added the required column `percentage` to the `Result` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "percentage" DOUBLE PRECISION NOT NULL;
