import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import { Tag } from '../../domain/types/tag.types.js';

export class SetTagsDto {
  @ApiProperty({ type: [String], description: 'Array of Tag IDs to assign to the business' })
  @IsArray()
  @IsString({ each: true })
  tagIds!: string[];
}

export class TagDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() slug: string;

  private constructor(t: Tag) {
    this.id = t.id;
    this.name = t.name;
    this.slug = t.slug;
  }

  static from(t: Tag): TagDto {
    return new TagDto(t);
  }
}
