import { InquiryView, InquiryMessageView, CreateInquiryInput, SendMessageInput, InquiryStatus } from '../types/inquiry.types.js';

export abstract class IInquiryRepository {
  abstract create(input: CreateInquiryInput): Promise<InquiryView>;
  abstract addMessage(input: SendMessageInput): Promise<InquiryMessageView>;
  abstract findById(id: string): Promise<InquiryView | null>;
  abstract findByBusinessProfile(businessProfileId: string): Promise<InquiryView[]>;
  abstract findByUser(userId: string): Promise<InquiryView[]>;
  abstract getMessages(inquiryId: string): Promise<InquiryMessageView[]>;
  abstract updateStatus(id: string, status: InquiryStatus): Promise<InquiryView>;
}
