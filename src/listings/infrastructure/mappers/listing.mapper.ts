import { ListingView, DynamicAttributes } from "../../core/domain/listing.view.js";
import { Prisma } from "../../../../generated/prisma/client.js";
import { MediaType } from "../../../shared/domain/listing.constants.js";

/**
 * The strict shape of the Listing as it comes out of Prisma
 * with its specific relations included.
 */
type ListingWithRelations = Prisma.ListingGetPayload<{
  include: {
    category: true;
    media: true;
    owner: { select: { name: true; avatarUrl: true } };
  };
}>;

export class ListingMapper {
  /**
   * Maps the strict Prisma result to the Domain View.
   * No 'any' allowed.
   */
  static toView(raw: ListingWithRelations): ListingView {
    return {
      id: raw.id,
      slug: raw.slug,
      title: raw.title,
      description: raw.description,
      basePrice: raw.basePrice,
      currency: raw.currency,
      isVerified: raw.isVerified,
      createdAt: raw.createdAt,

      /**
       * Prisma's 'attributes' is 'JsonValue'.
       * We explicitly cast to DynamicAttributes because we know
       * our UseCase validation keeps this column clean.
       */
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
    };
  }
}
