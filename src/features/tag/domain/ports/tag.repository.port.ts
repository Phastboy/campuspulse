import { Tag } from '../types/tag.entity.js';
import { CreateTagInput, UpdateTagInput, PaginatedTags } from '../types/tag.types.js';

export abstract class ITagRepository {
  abstract create(input: CreateTagInput, slug: string): Promise<Tag>;
  abstract findById(id: string): Promise<Tag | null>;
  abstract findBySlug(slug: string): Promise<Tag | null>;
  abstract isSlugTaken(slug: string): Promise<boolean>;
  abstract update(id: string, input: UpdateTagInput): Promise<Tag>;
  abstract delete(id: string): Promise<void>;
  abstract list(page: number, limit: number, search?: string): Promise<PaginatedTags>;
}
