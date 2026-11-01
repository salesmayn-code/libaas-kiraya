import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261022110524 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "review" drop constraint if exists "review_booking_id_unique";`);
    this.addSql(`create table if not exists "review" ("id" text not null, "booking_id" text not null, "customer_id" text not null, "vendor_id" text not null, "listing_id" text not null, "rating" integer not null, "fit" text check ("fit" in ('small', 'true', 'large')) null, "body" text null, "photo_keys" text[] null, "status" text check ("status" in ('published', 'hidden')) not null default 'published', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "review_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_review_booking_id_unique" ON "review" ("booking_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_deleted_at" ON "review" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_listing_id_status_created_at" ON "review" ("listing_id", "status", "created_at") WHERE deleted_at IS NULL;`);
    this.addSql(`alter table if exists "review" add constraint "review_rating_range" check ("rating" between 1 and 5);`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "review" cascade;`);
  }

}
