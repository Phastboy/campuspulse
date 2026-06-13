import { VerificationStatus } from './verification-status.enum.js';
import { BusinessType } from '../../../../../generated/prisma/client.js';

/**
 * Represents a public commercial storefront identity owned by a user.
 *
 * Branding media (logo, banner, gallery) is owned by the Media feature
 * via MediaResourceType.BUSINESS_PROFILE. order=0 is the primary brand image.
 *
 * NOT:
 *   - a user account
 *   - a team or org system
 *   - a CRM record
 *   - a legal entity abstraction
 */
export interface BusinessProfile {
  readonly id: string;
  readonly ownerId: string;
  readonly name: string;
  readonly slug: string;
  readonly isPublic: boolean;
  readonly verificationStatus: VerificationStatus;
  readonly description: string | null;
  readonly businessType: BusinessType;
  readonly websiteUrl: string | null;
  readonly isEmailVerified: boolean;
  readonly isPhoneVerified: boolean;
  readonly phoneNumber: string;
  readonly whatsapp: string;
  readonly email: string;
  readonly locationId: string | null;
  readonly location: string | null;
  readonly categoryId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
