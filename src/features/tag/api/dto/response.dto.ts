import { ApiProperty } from '@nestjs/swagger';
import { Tag } from '../../domain/types/tag.entity.js';
import { PaginatedTags } from '../../domain/types/tag.types.js';

export class TagResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() slug: string;

  private constructor(tag: Tag) {
    this.id = tag.id;
    this.name = tag.name;
    this.slug = tag.slug;
  }

  static from(tag: Tag): TagResponseDto {
    return new TagResponseDto(tag);
  }
}

export class PaginatedTagsResponseDto {
  @ApiProperty({ type: [TagResponseDto] }) items: TagResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;

  private constructor(paginated: PaginatedTags) {
    this.items = paginated.items.map((item) => TagResponseDto.from(item));
    this.total = paginated.total;
    this.page = paginated.page;
    this.limit = paginated.limit;
  }

  static from(paginated: PaginatedTags): PaginatedTagsResponseDto {
    return new PaginatedTagsResponseDto(paginated);
  }
}
