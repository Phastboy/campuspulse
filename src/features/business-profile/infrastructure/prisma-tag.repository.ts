import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { ITagRepository } from '../domain/ports/tag.repository.port.js';
import { Tag } from '../domain/types/tag.types.js';

@Injectable()
export class PrismaTagRepository extends ITagRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findAll(): Promise<Tag[]> {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findByIds(ids: string[]): Promise<Tag[]> {
    return this.prisma.tag.findMany({
      where: { id: { in: ids } },
    });
  }
}
