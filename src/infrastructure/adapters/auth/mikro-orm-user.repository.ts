import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import type { IGoogleUserRepository } from '@odysseon/auth';
import { User } from '@infrastructure/entities/user.entity';

/**
 * MikroORM implementation of {@link IGoogleUserRepository} from `@odysseon/auth`.
 *
 * Satisfies: `findById`, `findByEmail`, `findByGoogleId`, `create`, `update`.
 * Username is derived from the email prefix — it is display-only and not used
 * for authentication.
 */
@Injectable()
export class MikroOrmUserRepository implements IGoogleUserRepository<User> {
  constructor(
    @InjectRepository(User)
    private readonly repo: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ id });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ email });
  }

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.repo.findOne({ googleId });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.repo.create({
      email: data.email!,
      googleId: data.googleId ?? null,
      password: data.password ?? null,
      username: data.email!.split('@')[0],
      createdAt: new Date(),
    });
    await this.em.persist(user).flush();
    return user;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.repo.findOneOrFail({ id });
    if (data.email !== undefined) user.email = data.email;
    if (data.googleId !== undefined) user.googleId = data.googleId;
    if (data.password !== undefined) user.password = data.password;
    if (data.username !== undefined) user.username = data.username;
    await this.em.flush();
    return user;
  }
}
