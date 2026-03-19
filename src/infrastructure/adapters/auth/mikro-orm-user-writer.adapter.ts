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

  async upsert(data: {
    googleId: string;
    email: string;
    username: string;
  }): Promise<IUser> {
    // INSERT ... ON CONFLICT (google_id) DO NOTHING is race-safe under the
    // UNIQUE constraint. If a concurrent request already inserted the row,
    // the insert silently does nothing and we re-fetch by googleId.
    await this.em.getConnection().execute(
      `INSERT INTO users (google_id, email, username, created_at)
       VALUES (?, ?, ?, now())
       ON CONFLICT (google_id) DO NOTHING`,
      [data.googleId, data.email, data.username],
    );

    const user = await this.repo.findOneOrFail({ googleId: data.googleId });
    return user;
  }
}
