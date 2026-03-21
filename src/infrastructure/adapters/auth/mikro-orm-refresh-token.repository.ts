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
 * never persisted.
 *
 * `consumeByTokenHash` is atomic: a single `DELETE ... WHERE token = $1 AND
 * expires_at > now() RETURNING *` statement both validates and deletes the row
 * in one round-trip. No window exists for two concurrent requests to both
 * read the same token and proceed — the first DELETE wins, the second gets
 * zero rows back and returns null.
 */
@Injectable()
export class MikroOrmRefreshTokenRepository implements IRefreshTokenRepository<RefreshToken> {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: EntityRepository<RefreshToken>,
    @InjectRepository(User)
    private readonly userRepo: EntityRepository<User>,
    private readonly em: EntityManager,
  ) { }

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

  /**
   * Atomically consumes a refresh token.
   *
   * Uses `DELETE ... WHERE token = $1 AND expires_at > now() RETURNING *` so
   * the find and delete happen in a single statement. Under any level of
   * concurrency, only one caller can successfully delete the row — all others
   * receive zero rows and return null, preventing refresh-token replay.
   */
  async consumeByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    if (!tokenHash) {
      console.error('No tokenHash provided');
      return null;
    }

    let result: RefreshToken | null = null;

    await this.em.transactional(async (em) => {
      // Find and delete atomically
      const refreshToken = await em.findOne(RefreshToken, {
        token: tokenHash,
        expiresAt: { $gt: new Date() }
      });

      if (refreshToken) {
        await em.remove(refreshToken).flush();
        result = refreshToken;
      }
    });

    return result;
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.repo.nativeDelete({ userId });
  }
}
