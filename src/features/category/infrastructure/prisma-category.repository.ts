import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { ICategoryRepository } from '../domain/ports/category.repository.port.js';
import { Category } from '../domain/types/category.entity.js';
import {
  CategoryTreeNode,
  CategoryLeaf,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../domain/types/category.types.js';

// ---------------------------------------------------------------------------
// Local Prisma type alias (pre-migration guard)
// ---------------------------------------------------------------------------
type PrismaCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function toDomain(raw: PrismaCategory): Category {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    parentId: raw.parentId,
    order: raw.order,
    isActive: raw.isActive,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

@Injectable()
export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateCategoryInput, slug: string): Promise<Category> {
    const raw = await this.prisma.category.create({
      data: {
        name: input.name,
        slug,
        description: input.description ?? null,
        parentId: input.parentId ?? null,
        order: input.order ?? 0,
      },
    });
    return toDomain(raw);
  }

  async findById(id: string): Promise<Category | null> {
    const raw = await this.prisma.category.findUnique({ where: { id } });
    return raw ? toDomain(raw) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const raw = await this.prisma.category.findUnique({ where: { slug } });
    return raw ? toDomain(raw) : null;
  }

  async isSlugTaken(slug: string): Promise<boolean> {
    const count = await this.prisma.category.count({ where: { slug } });
    return count > 0;
  }

  async findTree(activeOnly = true): Promise<CategoryTreeNode[]> {
    // Fetch all roots + their children in one query via Prisma nested include
    const roots = await this.prisma.category.findMany({
      where: {
        parentId: null,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: { order: 'asc' },
      include: {
        children: {
          where: activeOnly ? { isActive: true } : {},
          orderBy: { order: 'asc' },
        },
      },
    });

    return (roots as unknown as (PrismaCategory & { children: PrismaCategory[] })[]).map(
      (root): CategoryTreeNode => ({
        id: root.id,
        name: root.name,
        slug: root.slug,
        description: root.description,
        order: root.order,
        isActive: root.isActive,
        children: root.children.map(
          (child): CategoryLeaf => ({
            id: child.id,
            name: child.name,
            slug: child.slug,
            description: child.description,
            order: child.order,
            isActive: child.isActive,
          }),
        ),
      }),
    );
  }

  async findLeafIdsByRootSlug(rootSlug: string): Promise<string[]> {
    const root = await this.prisma.category.findUnique({
      where: { slug: rootSlug },
      select: { id: true },
    });
    if (!root) return [];

    const leaves = await this.prisma.category.findMany({
      where: { parentId: root.id, isActive: true },
      select: { id: true },
    });
    return leaves.map((l) => l.id);
  }

  async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    const raw = await this.prisma.category.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
      },
    });
    return toDomain(raw);
  }

  async deactivate(id: string): Promise<Category> {
    const raw = await this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
    return toDomain(raw);
  }

  async activate(id: string): Promise<Category> {
    const raw = await this.prisma.category.update({
      where: { id },
      data: { isActive: true },
    });
    return toDomain(raw);
  }

  async hasAssignments(id: string): Promise<boolean> {
    const [bpCount, listingCount] = await Promise.all([
      this.prisma.businessProfile.count({ where: { categoryId: id } }),
      this.prisma.listing.count({ where: { categoryId: id } }),
    ]);
    return bpCount > 0 || listingCount > 0;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }
}
