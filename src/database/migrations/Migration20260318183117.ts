import { Migration } from '@mikro-orm/migrations';

export class Migration20260318183117 extends Migration {
  override up(): void {
    this.addSql(
      `create table "events" (
        "id"          uuid         not null default uuid_generate_v4(),
        "title"       varchar(255) not null,
        "datetime"    jsonb        not null,
        "venue"       varchar(255) not null,
        "description" varchar(255) null,
        "created_by"  uuid         null,
        "created_at"  timestamptz  not null,
        primary key ("id")
      );`,
    );

    this.addSql(
      `create table "users" (
        "id"         uuid         not null default uuid_generate_v4(),
        "google_id"  varchar(255) not null,
        "email"      varchar(255) not null,
        "username"   varchar(255) not null,
        "created_at" timestamptz  not null,
        primary key ("id")
      );`,
    );
    this.addSql(
      `create unique index "users_google_id_unique" on "users" ("google_id");`,
    );
    this.addSql(
      `create unique index "users_email_unique"     on "users" ("email");`,
    );

    this.addSql(
      `create table "refresh_tokens" (
        "id"         uuid         not null default uuid_generate_v4(),
        "jti"        varchar(255) not null,
        "user_id"    uuid         not null,
        "expires_at" timestamptz  not null,
        "created_at" timestamptz  not null,
        primary key ("id")
      );`,
    );
    this.addSql(
      `create unique index "refresh_tokens_jti_unique" on "refresh_tokens" ("jti");`,
    );
    this.addSql(
      `alter table "refresh_tokens"
         add constraint "refresh_tokens_user_id_foreign"
         foreign key ("user_id") references "users" ("id") on delete cascade;`,
    );
  }

  override down(): void {
    this.addSql(`drop table if exists "refresh_tokens";`);
    this.addSql(`drop table if exists "users";`);
    this.addSql(`drop table if exists "events";`);
  }
}
