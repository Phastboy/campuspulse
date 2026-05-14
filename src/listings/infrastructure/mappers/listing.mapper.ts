import { ListingView, DynamicAttributes } from '../../core/domain/listing.view.js';
import { Prisma } from '../../../../generated/prisma/client.js';
import { MediaType } from '../../../shared/domain/listing.constants.js';

type ListingWithRelations = Prisma.ListingGetPayload<{
  include: {
    category: true;
    media: true;
    businessProfile: {
      select: {
        name: true;
        logoUrl: true;
        slug: true;
        verificationStatus: true;
      };
    };
  };
}>;

export class ListingMapper {
  static toView(raw: ListingWithRelations): ListingView {
    return {
      id: raw.id,
      slug: raw.slug,
      title: raw.title,
      description: raw.description,
      priceMin: raw.priceMin,
      priceMax: raw.priceMax,
      currency: raw.currency,
      isVerified: raw.isVerified,
      createdAt: raw.createdAt,
      attributes: raw.attributes as DynamicAttributes,
      category: {
        id: raw.category.id,
        name: raw.category.name,
        slug: raw.category.slug,
      },
      media: raw.media.map((m) => ({
        url: m.url,
        type: m.type as MediaType,
        order: m.order,
      })),
      owner: {
        name: raw.businessProfile.name,
        avatarUrl: raw.businessProfile.logoUrl,
        slug: raw.businessProfile.slug,
        verificationStatus: raw.businessProfile.verificationStatus,
      },
    };
  }
}
