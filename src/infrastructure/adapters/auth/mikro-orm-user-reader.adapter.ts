import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { User } from '@infrastructure/entities/user.entity';
import { IUser } from '@domain/interfaces';
import { IUserReader } from '@ports/auth/user-reader.port';

@Injectable()
export class MikroOrmUserReaderAdapter implements IUserReader {
  constructor(
    @InjectRepository(User)
    private readonly repo: EntityRepository<User>,
  ) {}

  findById(id: string): Promise<IUser | null> {
    return this.repo.findOne({ id });
  }

  findByGoogleId(googleId: string): Promise<IUser | null> {
    return this.repo.findOne({ googleId });
  }
}
