-- CreateEnum
CREATE TYPE "BookCondition" AS ENUM ('like_new', 'very_good', 'good', 'acceptable', 'poor');

-- AlterTable
ALTER TABLE "books" ADD COLUMN     "category" TEXT,
ADD COLUMN     "condition" "BookCondition",
ADD COLUMN     "isbn" TEXT;

-- CreateIndex
CREATE INDEX "books_isbn_idx" ON "books"("isbn");
