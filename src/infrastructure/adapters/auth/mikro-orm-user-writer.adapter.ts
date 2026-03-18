import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { User } from '@infrastructure/entities/user.entity';
import { IUser } from '@domain/interfaces';
import { IUserWriter } from '@ports/auth/user-writer.port';

@Injectable()
export class MikroOrmUserWriterAdapter implements IUserWriter {
  constructor(
    @InjectRepository(User)
    private readonly repo: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  async create(data: { googleId: string; email: string; username: string }): Promise<IUser> {
    const user = this.repo.create({ ...data, createdAt: new Date() });
    await this.em.persist(user).flush();
    return user;
  }
}
