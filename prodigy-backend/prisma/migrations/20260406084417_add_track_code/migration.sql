/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `tracks` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "tracks" ADD COLUMN     "code" TEXT NOT NULL DEFAULT 'XX';

-- CreateIndex
CREATE UNIQUE INDEX "tracks_code_key" ON "tracks"("code");
