/*
  Warnings:

  - You are about to drop the column `latitude` on the `business_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `business_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `business_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `listings` table. All the data in the column will be lost.
  - You are about to drop the column `resourceId` on the `media` table. All the data in the column will be lost.
  - You are about to drop the column `resourceType` on the `media` table. All the data in the column will be lost.
  - You are about to drop the column `businessProfileId` on the `reviews` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[listingId,reviewerId]` on the table `reviews` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `listingId` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "StoreTourStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- DropForeignKey
ALTER TABLE "media" DROP CONSTRAINT "media_business_profile_fk";

-- DropForeignKey
ALTER TABLE "media" DROP CONSTRAINT "media_review_fk";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_businessProfileId_fkey";

-- DropIndex
DROP INDEX "business_profiles_latitude_longitude_idx";

-- DropIndex
DROP INDEX "listings_currency_idx";

-- DropIndex
DROP INDEX "media_resourceType_resourceId_idx";

-- DropIndex
DROP INDEX "media_resourceType_resourceId_order_idx";

-- DropIndex
DROP INDEX "media_resourceType_resourceId_role_idx";

-- DropIndex
DROP INDEX "reviews_businessProfileId_idx";

-- DropIndex
DROP INDEX "reviews_businessProfileId_reviewerId_key";

-- AlterTable
ALTER TABLE "business_profiles" DROP COLUMN "latitude",
DROP COLUMN "location",
DROP COLUMN "longitude",
ADD COLUMN     "locationId" TEXT;

-- AlterTable
ALTER TABLE "listings" DROP COLUMN "currency",
ADD COLUMN     "currencyCode" TEXT;

-- AlterTable
ALTER TABLE "media" DROP COLUMN "resourceId",
DROP COLUMN "resourceType",
ADD COLUMN     "businessProfileId" TEXT,
ADD COLUMN     "listingId" TEXT,
ADD COLUMN     "reviewId" TEXT,
ADD COLUMN     "storeTourId" TEXT;

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "businessProfileId",
ADD COLUMN     "listingId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "Currency";

-- DropEnum
DROP TYPE "MediaResourceType";

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coordinates" geometry(Point, 4326) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_tours" (
    "id" TEXT NOT NULL,
    "businessProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "status" "StoreTourStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_tours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_tour_highlights" (
    "id" TEXT NOT NULL,
    "storeTourId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "store_tour_highlights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_tours_businessProfileId_idx" ON "store_tours"("businessProfileId");

-- CreateIndex
CREATE INDEX "store_tours_status_idx" ON "store_tours"("status");

-- CreateIndex
CREATE INDEX "store_tour_highlights_storeTourId_idx" ON "store_tour_highlights"("storeTourId");

-- CreateIndex
CREATE INDEX "business_profiles_locationId_idx" ON "business_profiles"("locationId");

-- CreateIndex
CREATE INDEX "listings_currencyCode_idx" ON "listings"("currencyCode");

-- CreateIndex
CREATE INDEX "media_businessProfileId_idx" ON "media"("businessProfileId");

-- CreateIndex
CREATE INDEX "media_listingId_idx" ON "media"("listingId");

-- CreateIndex
CREATE INDEX "media_storeTourId_idx" ON "media"("storeTourId");

-- CreateIndex
CREATE INDEX "reviews_listingId_idx" ON "reviews"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_listingId_reviewerId_key" ON "reviews"("listingId", "reviewerId");

-- AddForeignKey
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_storeTourId_fkey" FOREIGN KEY ("storeTourId") REFERENCES "store_tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_tours" ADD CONSTRAINT "store_tours_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_tours" ADD CONSTRAINT "store_tours_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_tour_highlights" ADD CONSTRAINT "store_tour_highlights_storeTourId_fkey" FOREIGN KEY ("storeTourId") REFERENCES "store_tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
