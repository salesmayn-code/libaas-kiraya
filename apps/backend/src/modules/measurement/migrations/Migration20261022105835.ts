import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261022105835 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "measurement_profile" ("id" text not null, "customer_id" text not null, "label" text not null, "garment_type" text check ("garment_type" in ('women', 'men', 'kids')) not null default 'women', "unit" text check ("unit" in ('in', 'cm')) not null default 'in', "bust_chest" real null, "waist" real null, "hips" real null, "shoulder" real null, "height" real null, "is_default" boolean not null default false, "notes" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "measurement_profile_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_measurement_profile_deleted_at" ON "measurement_profile" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_measurement_profile_customer_id" ON "measurement_profile" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_measurement_profile_default" ON "measurement_profile" ("customer_id") WHERE is_default AND deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "measurement_profile" cascade;`);
  }

}
