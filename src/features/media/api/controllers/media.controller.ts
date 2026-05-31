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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Readable } from 'stream';
import { CurrentIdentity } from '@odysseon/whoami-adapter-nestjs';
import type { RequestIdentity } from '@odysseon/whoami-adapter-nestjs';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { AddMediaUseCase } from '../../application/use-cases/add-media.use-case.js';
import { DeleteMediaUseCase } from '../../application/use-cases/delete-media.use-case.js';
import { ReorderMediaUseCase } from '../../application/use-cases/reorder-media.use-case.js';
import { GetResourceMediaUseCase } from '../../application/use-cases/get-resource-media.use-case.js';
import { MediaResourceType } from '../../domain/types/media-resource-type.enum.js';
import { MediaRole } from '../../domain/types/media-role.enum.js';
import { MediaType } from '../../domain/types/media-type.enum.js';
import {
  MediaResponseDto,
  ReorderMediaDto,
  UploadMediaDto,
  BusinessProfileMediaDto,
  ListingMediaDto,
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
    return this.handleAdd(identity, MediaResourceType.LISTING, resourceId, file, dto.role);
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
    return this.handleAdd(identity, MediaResourceType.BUSINESS_PROFILE, resourceId, file, dto.role);
  }

  // ---------------------------------------------------------------------------
  // Fetch (grouped by role)
  // ---------------------------------------------------------------------------

  /**
   * GET /listings/:resourceId/media
   * Returns { cover, gallery } — structured for storefront rendering.
   */
  @Get('listings/:resourceId/media')
  async getListingMedia(@Param('resourceId') resourceId: string): Promise<ListingMediaDto> {
    const items = await this.getResourceMedia.execute(MediaResourceType.LISTING, resourceId);
    return ListingMediaDto.from(items);
  }

  /**
   * GET /business-profiles/:resourceId/media
   * Returns { logo, banner, gallery } — structured for storefront rendering.
   */
  @Get('business-profiles/:resourceId/media')
  async getBusinessProfileMedia(
    @Param('resourceId') resourceId: string,
  ): Promise<BusinessProfileMediaDto> {
    const items = await this.getResourceMedia.execute(
      MediaResourceType.BUSINESS_PROFILE,
      resourceId,
    );
    return BusinessProfileMediaDto.from(items);
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  /** DELETE /media/:id */
  @Delete('media/:id')
  async delete(
    @CurrentIdentity() identity: RequestIdentity,
    @Param('id') id: string,
  ): Promise<void> {
    await this.assertMediaOwnership(id, identity.accountId);
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
    await this.assertResourceOwnership(MediaResourceType.LISTING, resourceId, identity.accountId);
    const items = await this.reorderMedia.execute(
      MediaResourceType.LISTING,
      resourceId,
      dto.orderedIds,
    );
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
    await this.assertResourceOwnership(
      MediaResourceType.BUSINESS_PROFILE,
      resourceId,
      identity.accountId,
    );
    const items = await this.reorderMedia.execute(
      MediaResourceType.BUSINESS_PROFILE,
      resourceId,
      dto.orderedIds,
    );
    return items.map((m) => MediaResponseDto.from(m));
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async handleAdd(
    identity: RequestIdentity,
    resourceType: MediaResourceType,
    resourceId: string,
    file: Express.Multer.File | undefined,
    role: MediaRole,
  ): Promise<MediaResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    await this.assertResourceOwnership(resourceType, resourceId, identity.accountId);

    const mediaType = this.detectMediaType(file.mimetype);
    const userId = await this.resolveUserId(identity.accountId);

    const media = await this.addMedia.execute({
      resourceType,
      resourceId,
      requesterId: userId,
      fileName: file.originalname,
      fileStream: Readable.from(file.buffer),
      mediaType,
      role,
    });

    return MediaResponseDto.from(media);
  }

  private detectMediaType(mimetype: string): MediaType {
    if (mimetype.startsWith('image/')) return MediaType.IMAGE;
    if (mimetype.startsWith('video/')) return MediaType.VIDEO;
    throw new BadRequestException(`Unsupported media type: ${mimetype}`);
  }

  private async assertResourceOwnership(
    resourceType: MediaResourceType,
    resourceId: string,
    accountId: string,
  ): Promise<void> {
    const userId = await this.resolveUserId(accountId);

    if (resourceType === MediaResourceType.LISTING) {
      const listing = await this.prisma.listing.findUnique({
        where: { id: resourceId },
        select: { businessProfile: { select: { ownerId: true } } },
      });
      if (!listing) throw new NotFoundException('Listing not found.');
      if (listing.businessProfile.ownerId !== userId) {
        throw new ForbiddenException('You do not own this listing.');
      }
    }

    if (resourceType === MediaResourceType.BUSINESS_PROFILE) {
      const profile = await this.prisma.businessProfile.findUnique({
        where: { id: resourceId },
        select: { ownerId: true },
      });
      if (!profile) throw new NotFoundException('Business profile not found.');
      if (profile.ownerId !== userId) {
        throw new ForbiddenException('You do not own this business profile.');
      }
    }
  }

  private async assertMediaOwnership(id: string, accountId: string): Promise<void> {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media item not found.');
    await this.assertResourceOwnership(media.resourceType, media.resourceId, accountId);
  }

  private async resolveUserId(accountId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { accountId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found.');
    return user.id;
  }
}
