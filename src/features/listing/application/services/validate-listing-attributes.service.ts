import { Injectable, BadRequestException } from '@nestjs/common';
import { ICategoryRepository } from '../../../category/domain/ports/category.repository.port.js';
import { AttributeType } from '../../../category/domain/types/category-attribute.entity.js';

@Injectable()
export class ValidateListingAttributesService {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  /**
   * Validates the submitted attributes against the schema defined for the category.
   * Throws BadRequestException on failure.
   */
  async validate(categoryId: string, attributes?: Record<string, unknown> | null): Promise<void> {
    const schema = await this.categoryRepo.findAttributesByCategoryId(categoryId);
    const submitted = attributes || {};

    // 1. Check for required attributes
    for (const attr of schema) {
      if (attr.isRequired && (submitted[attr.key] === undefined || submitted[attr.key] === null)) {
        throw new BadRequestException(`Attribute '${attr.key}' (${attr.label}) is required.`);
      }
    }

    // 2. Validate submitted attributes
    for (const [key, value] of Object.entries(submitted)) {
      if (value === undefined || value === null) continue;

      const attrSchema = schema.find((a) => a.key === key);
      if (!attrSchema) {
        throw new BadRequestException(`Unknown attribute '${key}' for this category.`);
      }

      switch (attrSchema.type) {
        case AttributeType.STRING:
          if (typeof value !== 'string') {
            throw new BadRequestException(`Attribute '${key}' must be a string.`);
          }
          break;
        case AttributeType.NUMBER:
          if (typeof value !== 'number') {
            throw new BadRequestException(`Attribute '${key}' must be a number.`);
          }
          break;
        case AttributeType.BOOLEAN:
          if (typeof value !== 'boolean') {
            throw new BadRequestException(`Attribute '${key}' must be a boolean.`);
          }
          break;
        case AttributeType.SELECT:
          if (typeof value !== 'string') {
            throw new BadRequestException(`Attribute '${key}' must be a string.`);
          }
          if (!attrSchema.options?.includes(value)) {
            throw new BadRequestException(`Attribute '${key}' must be one of: ${attrSchema.options?.join(', ')}`);
          }
          break;
      }
    }
  }
}
