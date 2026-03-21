import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import type { IRefreshTokenRepository } from '@odysseon/auth';
import { RefreshToken } from '@infrastructure/entities/refresh-token.entity';
import { User } from '@infrastructure/entities/user.entity';

/**
 * MikroORM implementation of {@link IRefreshTokenRepository} from `@odysseon/auth`.
 *
 * `token` stores the SHA-256 hash from `CryptoTokenHasher` — raw tokens are
 * never persisted. `consumeByTokenHash` finds-and-deletes atomically, enforcing
 * single-use rotation.
 */
@Injectable()
export class MikroOrmRefreshTokenRepository implements IRefreshTokenRepository<RefreshToken> {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: EntityRepository<RefreshToken>,
    @InjectRepository(User)
    private readonly userRepo: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  async create(data: Omit<RefreshToken, 'id'>): Promise<RefreshToken> {
    const user = await this.userRepo.findOneOrFail({ id: data.userId });
    const record = this.repo.create({
      token: data.token,
      userId: data.userId,
      user,
      expiresAt: data.expiresAt,
      createdAt: new Date(),
    });
    await this.em.persist(record).flush();
    return record;
  }

  findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.repo.findOne({
      token: tokenHash,
      expiresAt: { $gt: new Date() },
    });
  }

  async consumeByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const record = await this.repo.findOne({
      token: tokenHash,
      expiresAt: { $gt: new Date() },
    });
    if (!record) return null;
    await this.repo.nativeDelete({ token: tokenHash });
    return record;
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.nativeDelete({ id });
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.repo.nativeDelete({ userId });
  }
}
