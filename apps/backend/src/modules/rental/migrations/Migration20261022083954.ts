import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261022083954 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "rental_variant_spec" drop constraint if exists "rental_variant_spec_variant_id_unique";`);
    this.addSql(`alter table if exists "rental_unit" drop constraint if exists "rental_unit_vendor_id_tag_code_unique";`);
    this.addSql(`alter table if exists "rental_listing" drop constraint if exists "rental_listing_product_id_unique";`);
    this.addSql(`create table if not exists "rental_listing" ("id" text not null, "product_id" text not null, "vendor_id" text not null, "city" text not null, "status" text check ("status" in ('draft', 'active', 'paused')) not null default 'draft', "base_amount" numeric not null, "base_days" integer not null default 3, "extra_day_amount" numeric not null, "cleaning_fee_amount" numeric not null default 0, "deposit_amount" numeric not null, "late_fee_amount" numeric not null, "lead_buffer_days" integer not null default 1, "return_buffer_days" integer not null default 2, "min_days" integer not null default 1, "max_days" integer not null default 7, "fulfillment_modes" text[] not null, "cancellation_policy" text check ("cancellation_policy" in ('flexible', 'standard', 'strict')) not null default 'standard', "occasion_tags" text[] null, "rating_avg" real not null default 0, "rating_count" integer not null default 0, "fit_small_count" integer not null default 0, "fit_true_count" integer not null default 0, "fit_large_count" integer not null default 0, "raw_base_amount" jsonb not null, "raw_extra_day_amount" jsonb not null, "raw_cleaning_fee_amount" jsonb not null default '{"value":"0","precision":20}', "raw_deposit_amount" jsonb not null, "raw_late_fee_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rental_listing_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rental_listing_product_id_unique" ON "rental_listing" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_listing_deleted_at" ON "rental_listing" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_listing_city_status" ON "rental_listing" ("city", "status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_listing_vendor_id_status" ON "rental_listing" ("vendor_id", "status") WHERE deleted_at IS NULL;`);
    this.addSql(`alter table if exists "rental_listing" add constraint "rental_listing_rules_check" check ("base_days" >= 1 and "min_days" >= 1 and "max_days" >= "min_days" and "lead_buffer_days" >= 0 and "return_buffer_days" >= 0);`);
    this.addSql(`alter table if exists "rental_listing" add constraint "rental_listing_amounts_check" check ("base_amount" >= 0 and "extra_day_amount" >= 0 and "cleaning_fee_amount" >= 0 and "deposit_amount" >= 0 and "late_fee_amount" >= 0);`);
    this.addSql(`alter table if exists "rental_listing" add constraint "rental_listing_rating_check" check ("rating_avg" between 0 and 5 and "rating_count" >= 0);`);

    this.addSql(`create table if not exists "rental_setting" ("id" text not null, "hold_ttl_minutes" integer not null default 15, "max_active_holds" integer not null default 3, "inspection_window_hours" integer not null default 48, "dispute_window_hours" integer not null default 72, "default_lead_buffer_days" integer not null default 1, "default_return_buffer_days" integer not null default 2, "default_commission_bps" integer not null default 1200, "admin_review_deduction_pct" integer not null default 50, "min_payout_amount" numeric not null default 5000, "vendor_cancel_penalty_amount" numeric not null default 2000, "raw_min_payout_amount" jsonb not null default '{"value":"5000","precision":20}', "raw_vendor_cancel_penalty_amount" jsonb not null default '{"value":"2000","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rental_setting_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_setting_deleted_at" ON "rental_setting" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rental_unit" ("id" text not null, "listing_id" text not null, "variant_id" text not null, "vendor_id" text not null, "tag_code" text not null, "condition_grade" text check ("condition_grade" in ('A', 'B', 'C')) not null default 'A', "status" text check ("status" in ('active', 'maintenance', 'retired')) not null default 'active', "last_booked_at" timestamptz null, "notes" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rental_unit_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_unit_listing_id" ON "rental_unit" ("listing_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_unit_deleted_at" ON "rental_unit" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_unit_listing_id_variant_id_status" ON "rental_unit" ("listing_id", "variant_id", "status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rental_unit_vendor_id_tag_code_unique" ON "rental_unit" ("vendor_id", "tag_code") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rental_variant_spec" ("id" text not null, "listing_id" text not null, "variant_id" text not null, "size_label" text not null, "measurements" jsonb not null, "alterable" boolean not null default false, "alteration_notes" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rental_variant_spec_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_variant_spec_listing_id" ON "rental_variant_spec" ("listing_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rental_variant_spec_variant_id_unique" ON "rental_variant_spec" ("variant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_variant_spec_deleted_at" ON "rental_variant_spec" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "rental_unit" add constraint "rental_unit_listing_id_foreign" foreign key ("listing_id") references "rental_listing" ("id") on update cascade;`);

    this.addSql(`alter table if exists "rental_variant_spec" add constraint "rental_variant_spec_listing_id_foreign" foreign key ("listing_id") references "rental_listing" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "rental_unit" drop constraint if exists "rental_unit_listing_id_foreign";`);

    this.addSql(`alter table if exists "rental_variant_spec" drop constraint if exists "rental_variant_spec_listing_id_foreign";`);

    this.addSql(`drop table if exists "rental_listing" cascade;`);

    this.addSql(`drop table if exists "rental_setting" cascade;`);

    this.addSql(`drop table if exists "rental_unit" cascade;`);

    this.addSql(`drop table if exists "rental_variant_spec" cascade;`);
  }

}
