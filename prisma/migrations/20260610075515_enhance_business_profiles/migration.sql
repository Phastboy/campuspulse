/*
  Warnings:

  - Added the required column `formattedAddress` to the `Location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessType` to the `business_profiles` table without a default value. This is not possible if the table is not empty.
  - Made the column `phoneNumber` on table `business_profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `whatsapp` on table `business_profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `business_profiles` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('ONLINE', 'PHYSICAL', 'HYBRID');

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "formattedAddress" TEXT NOT NULL,
ADD COLUMN     "placeId" TEXT,
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "business_profiles" ADD COLUMN     "businessType" "BusinessType" NOT NULL,
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "websiteUrl" TEXT,
ALTER COLUMN "phoneNumber" SET NOT NULL,
ALTER COLUMN "whatsapp" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL;

-- CreateTable
CREATE TABLE "business_profile_drafts" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_profile_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_profile_drafts_ownerId_idx" ON "business_profile_drafts"("ownerId");

-- AddForeignKey
ALTER TABLE "business_profile_drafts" ADD CONSTRAINT "business_profile_drafts_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
