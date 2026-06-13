import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Readable } from 'stream';
import { CurrentIdentity, Public } from '@odysseon/whoami-adapter-nestjs';
import type { RequestIdentity } from '@odysseon/whoami-adapter-nestjs';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { AddMediaUseCase } from '../../application/use-cases/add-media.use-case.js';
import { DeleteMediaUseCase } from '../../application/use-cases/delete-media.use-case.js';
import { ReorderMediaUseCase } from '../../application/use-cases/reorder-media.use-case.js';
import { GetResourceMediaUseCase } from '../../application/use-cases/get-resource-media.use-case.js';
import { MediaOwnerKey } from '../../domain/ports/media.repository.port.js';
import { MediaRole } from '../../domain/types/media-role.enum.js';
import { MediaType } from '../../domain/types/media-type.enum.js';
import { ModeratorOrAdminGuard } from '../../../../shared/decorators/moderator-or-admin-guard.decorator.js';
import {
  MediaResponseDto,
  ReorderMediaDto,
  UploadMediaDto,
  BusinessProfileMediaDto,
  ListingMediaDto,
  ReviewMediaDto,
  StoreTourMediaDto,
} from '../dto/media.dto.js';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Media')
@Controller()
export class MediaController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly addMedia: AddMediaUseCase,
    private readonly deleteMedia: DeleteMediaUseCase,
    private readonly reorderMedia: ReorderMediaUseCase,
    private readonly getResourceMedia: GetResourceMediaUseCase,
  ) {}

  // ---------------------------------------------------------------------------
  // Upload
  // ---------------------------------------------------------------------------

  /**
   * POST /listings/:resourceId/media
   *
   * Accepts multipart/form-data with:
   *   - file:  the image or video file
   *   - role:  "COVER" | "GALLERY"
   */
  @Post('listings/:resourceId/media')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadMediaDto })
  async addListingMedia(
    @CurrentIdentity() identity: RequestIdentity,
    @Param('resourceId') resourceId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadMediaDto,
  ): Promise<MediaResponseDto> {
    return this.#handleAdd(identity, 'listingId', resourceId, file, dto.role);
  }

  /**
   * POST /business-profiles/:resourceId/media
   *
   * Accepts multipart/form-data with:
   *   - file:  the image or video file
   *   - role:  "LOGO" | "BANNER" | "GALLERY"
   */
  @Post('business-profiles/:resourceId/media')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadMediaDto })
  async addBusinessProfileMedia(
    @CurrentIdentity() identity: RequestIdentity,
    @Param('resourceId') resourceId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadMediaDto,
  ): Promise<MediaResponseDto> {
    return this.#handleAdd(identity, 'businessProfileId', resourceId, file, dto.role);
  }

  /**
   * POST /reviews/:resourceId/media
   *
   * Accepts multipart/form-data with:
   *   - file: the image file
   *   - role: "GALLERY" (only valid role for reviews)
   *
   * Only the reviewer who created the review may upload media.
   */
  @Post('reviews/:resourceId/media')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadMediaDto })
  async addReviewMedia(
    @CurrentIdentity() identity: RequestIdentity,
    @Param('resourceId') resourceId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadMediaDto,
  ): Promise<MediaResponseDto> {
    return this.#handleAdd(identity, 'reviewId', resourceId, file, dto.role);
  }

  /**
   * POST /store-tours/:resourceId/media
   *
   * Accepts multipart/form-data with:
   *   - file: the image or video file
   *   - role: "GALLERY" (only valid role for store tours)
   *
   * Only the creator who created the store tour may upload media.
   */
  @Post('store-tours/:resourceId/media')
  @ModeratorOrAdminGuard()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadMediaDto })
  async addStoreTourMedia(
    @CurrentIdentity() identity: RequestIdentity,
    @Param('resourceId') resourceId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadMediaDto,
  ): Promise<MediaResponseDto> {
    return this.#handleAdd(identity, 'storeTourId', resourceId, file, dto.role);
  }

  // ---------------------------------------------------------------------------
  // Fetch (grouped by role)
  // ---------------------------------------------------------------------------

  /**
   * GET /listings/:resourceId/media
   * Returns { cover, gallery } — structured for storefront rendering.
   */
  @Public()
  @Get('listings/:resourceId/media')
  async getListingMedia(@Param('resourceId') resourceId: string): Promise<ListingMediaDto> {
    const items = await this.getResourceMedia.execute('listingId', resourceId);
    return ListingMediaDto.from(items);
  }

  /**
   * GET /business-profiles/:resourceId/media
   * Returns { logo, banner, gallery } — structured for storefront rendering.
   */
  @Public()
  @Get('business-profiles/:resourceId/media')
  async getBusinessProfileMedia(
    @Param('resourceId') resourceId: string,
  ): Promise<BusinessProfileMediaDto> {
    const items = await this.getResourceMedia.execute('businessProfileId', resourceId);
    return BusinessProfileMediaDto.from(items);
  }

  /**
   * GET /reviews/:resourceId/media
   * Returns { gallery } — raw user photos, gallery-ordered.
   */
  @Public()
  @Get('reviews/:resourceId/media')
  async getReviewMedia(@Param('resourceId') resourceId: string): Promise<ReviewMediaDto> {
    const items = await this.getResourceMedia.execute('reviewId', resourceId);
    return ReviewMediaDto.from(items);
  }

  /**
   * GET /store-tours/:resourceId/media
   * Returns { gallery } — raw user photos, gallery-ordered.
   */
  @Public()
  @Get('store-tours/:resourceId/media')
  async getStoreTourMedia(@Param('resourceId') resourceId: string): Promise<StoreTourMediaDto> {
    const items = await this.getResourceMedia.execute('storeTourId', resourceId);
    return StoreTourMediaDto.from(items);
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  /** DELETE /media/:id */
  @HttpCode(204)
  @Delete('media/:id')
  async delete(
    @CurrentIdentity() identity: RequestIdentity,
    @Param('id') id: string,
  ): Promise<void> {
    await this.#assertMediaOwnership(id, identity.accountId);
    await this.deleteMedia.execute(id);
  }

  // ---------------------------------------------------------------------------
  // Reorder (GALLERY only)
  // ---------------------------------------------------------------------------

  /**
   * PATCH /listings/:resourceId/media/reorder
   * orderedIds must include all GALLERY item IDs only — not COVER.
   */
  @Patch('listings/:resourceId/media/reorder')
  async reorderListingMedia(
    @CurrentIdentity() identity: RequestIdentity,
    @Param('resourceId') resourceId: string,
    @Body() dto: ReorderMediaDto,
  ): Promise<MediaResponseDto[]> {
    await this.#assertResourceOwnership('listingId', resourceId, identity.accountId);
    const items = await this.reorderMedia.execute('listingId', resourceId, dto.orderedIds);
    return items.map((m) => MediaResponseDto.from(m));
  }

  /**
   * PATCH /business-profiles/:resourceId/media/reorder
   * orderedIds must include all GALLERY item IDs only — not LOGO or BANNER.
   */
  @Patch('business-profiles/:resourceId/media/reorder')
  async reorderBusinessProfileMedia(
    @CurrentIdentity() identity: RequestIdentity,
    @Param('resourceId') resourceId: string,
    @Body() dto: ReorderMediaDto,
  ): Promise<MediaResponseDto[]> {
    await this.#assertResourceOwnership('businessProfileId', resourceId, identity.accountId);
    const items = await this.reorderMedia.execute('businessProfileId', resourceId, dto.orderedIds);
    return items.map((m) => MediaResponseDto.from(m));
  }

  /**
   * PATCH /reviews/:resourceId/media/reorder
   * orderedIds must include all GALLERY item IDs for this review.
   * Only the reviewer may reorder their own review media.
   */
  @Patch('reviews/:resourceId/media/reorder')
  async reorderReviewMedia(
    @CurrentIdentity() identity: RequestIdentity,
    @Param('resourceId') resourceId: string,
    @Body() dto: ReorderMediaDto,
  ): Promise<MediaResponseDto[]> {
    await this.#assertResourceOwnership('reviewId', resourceId, identity.accountId);
    const items = await this.reorderMedia.execute('reviewId', resourceId, dto.orderedIds);
    return items.map((m) => MediaResponseDto.from(m));
  }

  /**
   * PATCH /store-tours/:resourceId/media/reorder
   * orderedIds must include all GALLERY item IDs for this store tour.
   * Only the creator may reorder their own store tour media.
   */
  @Patch('store-tours/:resourceId/media/reorder')
  @ModeratorOrAdminGuard()
  async reorderStoreTourMedia(
    @CurrentIdentity() identity: RequestIdentity,
    @Param('resourceId') resourceId: string,
    @Body() dto: ReorderMediaDto,
  ): Promise<MediaResponseDto[]> {
    await this.#assertResourceOwnership('storeTourId', resourceId, identity.accountId);
    const items = await this.reorderMedia.execute('storeTourId', resourceId, dto.orderedIds);
    return items.map((m) => MediaResponseDto.from(m));
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  async #handleAdd(
    identity: RequestIdentity,
    ownerKey: MediaOwnerKey,
    resourceId: string,
    file: Express.Multer.File | undefined,
    role: MediaRole,
  ): Promise<MediaResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    await this.#assertResourceOwnership(ownerKey, resourceId, identity.accountId);

    const mediaType = this.#detectMediaType(file.mimetype);
    const userId = await this.#resolveUserId(identity.accountId);

    const media = await this.addMedia.execute({
      ownerKey,
      ownerId: resourceId,
      requesterId: userId,
      fileName: file.originalname,
      fileStream: Readable.from(file.buffer),
      mediaType,
      role,
    });

    return MediaResponseDto.from(media);
  }

  #detectMediaType(mimetype: string): MediaType {
    if (mimetype.startsWith('image/')) return MediaType.IMAGE;
    if (mimetype.startsWith('video/')) return MediaType.VIDEO;
    throw new BadRequestException(`Unsupported media type: ${mimetype}`);
  }

  async #assertResourceOwnership(
    ownerKey: MediaOwnerKey,
    resourceId: string,
    accountId: string,
  ): Promise<void> {
    const userId = await this.#resolveUserId(accountId);

    if (ownerKey === 'listingId') {
      const listing = await this.prisma.listing.findUnique({
        where: { id: resourceId },
        select: { businessProfile: { select: { ownerId: true } } },
      });
      if (!listing) throw new NotFoundException('Listing not found.');
      if (listing.businessProfile.ownerId !== userId) {
        throw new ForbiddenException('You do not own this listing.');
      }
    }

    if (ownerKey === 'businessProfileId') {
      const profile = await this.prisma.businessProfile.findUnique({
        where: { id: resourceId },
        select: { ownerId: true },
      });
      if (!profile) throw new NotFoundException('Business profile not found.');
      if (profile.ownerId !== userId) {
        throw new ForbiddenException('You do not own this business profile.');
      }
    }

    if (ownerKey === 'reviewId') {
      const review = await this.prisma.review.findUnique({
        where: { id: resourceId },
        select: { reviewerId: true },
      });
      if (!review) throw new NotFoundException('Review not found.');
      if (review.reviewerId !== userId) {
        throw new ForbiddenException('You can only manage media on your own reviews.');
      }
    }

    if (ownerKey === 'storeTourId') {
      const tour = await this.prisma.storeTour.findUnique({
        where: { id: resourceId },
        select: { createdById: true },
      });
      if (!tour) throw new NotFoundException('Store tour not found.');
      if (tour.createdById !== userId) {
        throw new ForbiddenException('You can only manage media on your own store tours.');
      }
    }
  }

  async #assertMediaOwnership(id: string, accountId: string): Promise<void> {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media item not found.');
    let ownerKey: MediaOwnerKey | null = null;
    let resourceId = '';

    if (media.businessProfileId) {
      ownerKey = 'businessProfileId';
      resourceId = media.businessProfileId;
    } else if (media.listingId) {
      ownerKey = 'listingId';
      resourceId = media.listingId;
    } else if (media.storeTourId) {
      ownerKey = 'storeTourId';
      resourceId = media.storeTourId;
    } else if (media.reviewId) {
      ownerKey = 'reviewId';
      resourceId = media.reviewId;
    }

    if (!ownerKey) {
      throw new BadRequestException('Media is orphaned');
    }
    await this.#assertResourceOwnership(ownerKey, resourceId, accountId);
  }

  async #resolveUserId(accountId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { accountId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found.');
    return user.id;
  }
}
