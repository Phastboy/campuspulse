import { Migration } from '@mikro-orm/migrations';

export class Migration20260312171008 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "events" ("id" uuid not null default uuid_generate_v4(), "title" varchar(255) not null, "datetime" jsonb not null, "venue" varchar(255) not null, "description" varchar(255) null, "created_at" timestamptz not null, constraint "events_pkey" primary key ("id"));`);
  }

}
