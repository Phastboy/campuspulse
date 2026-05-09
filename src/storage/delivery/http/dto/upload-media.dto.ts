import { IsIn } from 'class-validator';

/**
 * Valid domain categories for storage destinations.
 */
export const MEDIA_FOLDER_TYPES = ['AVATAR', 'VENUE_GALLERY'] as const;

/**
 * Type derived from valid media folder constants.
 */
export type MediaFolderType = (typeof MEDIA_FOLDER_TYPES)[number];

/**
 * Payload for uploading a brand new media asset.
 */
export class UploadMediaDto {
  /**
   * The domain category for this file.
   * Determines the internal storage path.
   * @example "AVATAR"
   */
  @IsIn(MEDIA_FOLDER_TYPES)
  folderType!: MediaFolderType;
}
