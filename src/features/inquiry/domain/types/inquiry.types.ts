export type InquiryStatus = 'UNREAD' | 'READ' | 'RESPONDED' | 'CLOSED';

export interface InquiryView {
  id: string;
  businessProfileId: string;
  userId: string;
  listingId: string | null;
  subject: string | null;
  status: InquiryStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface InquiryMessageView {
  id: string;
  inquiryId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}

export interface CreateInquiryInput {
  businessProfileId: string;
  userId: string;
  listingId?: string;
  subject?: string;
  initialMessage: string;
}

export interface SendMessageInput {
  inquiryId: string;
  senderId: string;
  content: string;
}
