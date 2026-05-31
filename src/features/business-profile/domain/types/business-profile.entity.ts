import { VerificationStatus } from './verification-status.enum.js';

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
  readonly phoneNumber: string | null;
  readonly whatsapp: string | null;
  readonly email: string | null;
  readonly location: string | null;
  readonly categoryId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
