export type BusinessType =
  | 'INDIVIDUAL'
  | 'RETAILER'
  | 'DISTRIBUTOR'
  | 'MANUFACTURER'
  | 'WHOLESALER'
  | 'AGENCY';

export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface BusinessProfileView {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: BusinessType;

  logoUrl: string | null;
  bannerUrl: string | null;

  email: string | null;
  phoneNumber: string | null;
  whatsapp: string | null;
  location: string | null;

  verificationStatus: VerificationStatus;
  isPublic: boolean;

  ownerId: string;

  createdAt: Date;
  updatedAt: Date;
}
