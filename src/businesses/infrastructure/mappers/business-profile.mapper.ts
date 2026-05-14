import type { BusinessProfileView } from '../../core/domain/business-profile.view.js';
import { BusinessProfileResponseDto } from '../../delivery/http/dto/business-profile-response.dto.js';

export class BusinessProfileMapper {
  static toResponse(view: BusinessProfileView): BusinessProfileResponseDto {
    const dto = new BusinessProfileResponseDto();
    dto.id = view.id;
    dto.slug = view.slug;
    dto.name = view.name;
    dto.description = view.description;
    dto.type = view.type;
    dto.logoUrl = view.logoUrl;
    dto.bannerUrl = view.bannerUrl;
    dto.email = view.email;
    dto.phoneNumber = view.phoneNumber;
    dto.whatsapp = view.whatsapp;
    dto.location = view.location;
    dto.verificationStatus = view.verificationStatus;
    dto.isPublic = view.isPublic;
    dto.createdAt = view.createdAt;
    dto.updatedAt = view.updatedAt;
    return dto;
  }
}
