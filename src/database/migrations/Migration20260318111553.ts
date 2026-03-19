import { Migration } from '@mikro-orm/migrations';

export class Migration20260318111553 extends Migration {
  override up(): void {
    this.addSql(`
      create table "users" (
        "id"         uuid         not null default uuid_generate_v4(),
        "google_id"  varchar(255) not null,
        "email"      varchar(255) not null,
        "username"   varchar(255) not null,
        "created_at" timestamptz  not null,
        constraint "users_pkey" primary key ("id")
      );
    `);
    this.addSql(`create index on "users" ("google_id");`);
    this.addSql(`create index on "users" ("email");`);

    this.addSql(`
      create table "refresh_tokens" (
        "id"         uuid         not null default uuid_generate_v4(),
        "jti"        varchar(255) not null,
        "user_id"    uuid         not null,
        "expires_at" timestamptz  not null,
        "created_at" timestamptz  not null,
        constraint "refresh_tokens_pkey" primary key ("id")
      );
    `);
    this.addSql(`create index on "refresh_tokens" ("jti");`);
    this.addSql(`
      alter table "refresh_tokens"
        add constraint "refresh_tokens_user_id_fkey"
        foreign key ("user_id") references "users" ("id")
        on delete cascade;
    `);

    this.addSql(`alter table "events" add column "created_by" uuid null;`);
  }

  override down(): void {
    this.addSql(`alter table "events" drop column "created_by";`);
    this.addSql(`drop table if exists "refresh_tokens";`);
    this.addSql(`drop table if exists "users";`);
  }
}
