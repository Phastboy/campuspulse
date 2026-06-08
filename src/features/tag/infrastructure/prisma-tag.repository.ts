import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { ITagRepository } from '../domain/ports/tag.repository.port.js';
import { Tag } from '../domain/types/tag.entity.js';
import { CreateTagInput, UpdateTagInput, PaginatedTags } from '../domain/types/tag.types.js';

@Injectable()
export class PrismaTagRepository implements ITagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateTagInput, slug: string): Promise<Tag> {
    return this.prisma.tag.create({
      data: {
        name: input.name,
        slug,
      },
    });
  }

  async findById(id: string): Promise<Tag | null> {
    return this.prisma.tag.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    return this.prisma.tag.findUnique({ where: { slug } });
  }

  async isSlugTaken(slug: string): Promise<boolean> {
    const count = await this.prisma.tag.count({ where: { slug } });
    return count > 0;
  }

  async update(id: string, input: UpdateTagInput): Promise<Tag> {
    return this.prisma.tag.update({
      where: { id },
      data: { name: input.name },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tag.delete({ where: { id } });
  }

  async list(page: number, limit: number, search?: string): Promise<PaginatedTags> {
    const where: Prisma.TagWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.tag.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.tag.count({ where }),
    ]);

    return { items, total, page, limit };
  }
}
