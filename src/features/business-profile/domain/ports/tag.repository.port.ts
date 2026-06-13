import { Tag } from '../types/tag.types.js';

export abstract class ITagRepository {
  abstract findAll(): Promise<Tag[]>;
  abstract findByIds(ids: string[]): Promise<Tag[]>;
}
