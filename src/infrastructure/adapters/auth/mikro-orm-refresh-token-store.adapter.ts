import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { RefreshToken } from '@infrastructure/entities/refresh-token.entity';
import { User } from '@infrastructure/entities/user.entity';
import { IRefreshTokenStore } from '@ports/auth/refresh-token-store.port';

@Injectable()
export class MikroOrmRefreshTokenStoreAdapter implements IRefreshTokenStore {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: EntityRepository<RefreshToken>,
    @InjectRepository(User)
    private readonly userRepo: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  async save(userId: string, jti: string, expiresAt: Date): Promise<void> {
    const user = await this.userRepo.findOneOrFail({ id: userId });
    const token = this.repo.create({ jti, user, expiresAt, createdAt: new Date() });
    await this.em.persist(token).flush();
  }

  async findValid(jti: string): Promise<{ userId: string } | null> {
    const token = await this.repo.findOne(
      { jti, expiresAt: { $gt: new Date() } },
      { populate: ['user'] },
    );
    if (!token) return null;
    return { userId: token.user.id };
  }

  async delete(jti: string): Promise<void> {
    const token = await this.repo.findOne({ jti });
    if (token) await this.em.remove(token).flush();
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.repo.nativeDelete({ user: { id: userId } });
  }
}
