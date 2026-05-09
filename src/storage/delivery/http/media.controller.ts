import {
  Controller,
  Post,
  Put,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import { Readable } from 'stream';
import { ImageStorageService } from '../../image-storage.service.js';
import { UploadMediaDto, MediaFolderType } from './dto/upload-media.dto.js';
import 'multer';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  /**
   * Secure internal mapping of domain categories to storage paths.
   */
  private readonly folderMap: Record<MediaFolderType, string> = {
    AVATAR: 'users/avatars',
    VENUE_GALLERY: 'venues/galleries',
  };

  constructor(private readonly imageStorage: ImageStorageService) {}

  /**
   * Upload a brand new image to a specific domain folder.
   *
   * @param body - Contains the destination folder type.
   * @param file - The binary file data from multipart/form-data.
   * @returns The public URL and management fileId.
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async uploadFile(@Body() body: UploadMediaDto, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');

    const fileStream = Readable.from(file.buffer);

    return await this.imageStorage.uploadNewImage({
      destination: this.folderMap[body.folderType],
      fileName: file.originalname,
      fileData: fileStream,
    });
  }
}
