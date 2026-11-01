import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261022091117 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "rental_deposit" drop constraint if exists "rental_deposit_booking_id_unique";`);
    this.addSql(`create table if not exists "rental_booking" ("id" text not null, "listing_id" text not null, "unit_id" text not null, "variant_id" text not null, "vendor_id" text not null, "customer_id" text not null, "cart_id" text null, "order_id" text null, "line_item_id" text null, "event_date" timestamptz not null, "rental_start" timestamptz not null, "rental_end" timestamptz not null, "blocked_start" timestamptz not null, "blocked_end" timestamptz not null, "days" integer not null, "status" text check ("status" in ('held', 'confirmed', 'with_customer', 'returned', 'settling', 'disputed', 'completed', 'cancelled', 'expired')) not null default 'held', "ops_flag" text check ("ops_flag" in ('none', 'overdue', 'at_risk', 'settlement_failed', 'cancel_failed')) not null default 'none', "hold_expires_at" timestamptz null, "fulfillment_mode" text check ("fulfillment_mode" in ('pickup', 'courier')) not null, "delivery_address" jsonb null, "currency_code" text not null, "rental_fee" numeric not null, "cleaning_fee" numeric not null, "deposit_amount" numeric not null, "platform_fee" numeric not null, "pricing_snapshot" jsonb not null, "cancelled_by" text check ("cancelled_by" in ('customer', 'vendor', 'admin', 'system')) null, "cancellation_reason" text null, "cancelled_at" timestamptz null, "dispatched_at" timestamptz null, "returned_at" timestamptz null, "inspection_due_at" timestamptz null, "completed_at" timestamptz null, "raw_rental_fee" jsonb not null, "raw_cleaning_fee" jsonb not null, "raw_deposit_amount" jsonb not null, "raw_platform_fee" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rental_booking_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_booking_listing_id" ON "rental_booking" ("listing_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_booking_unit_id" ON "rental_booking" ("unit_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_booking_deleted_at" ON "rental_booking" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_booking_vendor_id_status_rental_start" ON "rental_booking" ("vendor_id", "status", "rental_start") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_booking_customer_id_status" ON "rental_booking" ("customer_id", "status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_booking_order_id" ON "rental_booking" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_booking_status_hold_expires_at" ON "rental_booking" ("status", "hold_expires_at") WHERE status = 'held' AND deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_booking_status_inspection_due_at" ON "rental_booking" ("status", "inspection_due_at") WHERE status = 'returned' AND deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_booking_status_rental_end" ON "rental_booking" ("status", "rental_end") WHERE status = 'with_customer' AND deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rental_deposit" ("id" text not null, "booking_id" text not null, "mode" text check ("mode" in ('hold', 'charge_refund')) not null, "amount" numeric not null, "status" text check ("status" in ('pending', 'secured', 'settled', 'released', 'failed')) not null default 'pending', "payment_collection_id" text null, "captured_amount" numeric not null default 0, "released_amount" numeric not null default 0, "authorization_expires_at" timestamptz null, "secured_at" timestamptz null, "settled_at" timestamptz null, "raw_amount" jsonb not null, "raw_captured_amount" jsonb not null default '{"value":"0","precision":20}', "raw_released_amount" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rental_deposit_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rental_deposit_booking_id_unique" ON "rental_deposit" ("booking_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_deposit_deleted_at" ON "rental_deposit" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rental_booking_event" ("id" text not null, "booking_id" text not null, "from_status" text null, "to_status" text not null, "actor_type" text check ("actor_type" in ('customer', 'vendor', 'admin', 'system')) not null, "actor_id" text null, "meta" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rental_booking_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_booking_event_booking_id" ON "rental_booking_event" ("booking_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_booking_event_deleted_at" ON "rental_booking_event" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_booking_event_booking_id_created_at" ON "rental_booking_event" ("booking_id", "created_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rental_block" ("id" text not null, "unit_id" text not null, "vendor_id" text not null, "start_date" timestamptz not null, "end_date" timestamptz not null, "reason" text check ("reason" in ('maintenance', 'offline_rental', 'other')) not null, "note" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rental_block_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_block_unit_id" ON "rental_block" ("unit_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_block_deleted_at" ON "rental_block" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_block_vendor_id_start_date" ON "rental_block" ("vendor_id", "start_date") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "rental_booking" add constraint "rental_booking_listing_id_foreign" foreign key ("listing_id") references "rental_listing" ("id") on update cascade;`);
    this.addSql(`alter table if exists "rental_booking" add constraint "rental_booking_unit_id_foreign" foreign key ("unit_id") references "rental_unit" ("id") on update cascade;`);

    this.addSql(`alter table if exists "rental_deposit" add constraint "rental_deposit_booking_id_foreign" foreign key ("booking_id") references "rental_booking" ("id") on update cascade;`);

    this.addSql(`alter table if exists "rental_booking_event" add constraint "rental_booking_event_booking_id_foreign" foreign key ("booking_id") references "rental_booking" ("id") on update cascade;`);

    this.addSql(`alter table if exists "rental_block" add constraint "rental_block_unit_id_foreign" foreign key ("unit_id") references "rental_unit" ("id") on update cascade;`);

    this.addSql(`CREATE EXTENSION IF NOT EXISTS btree_gist;`);

    this.addSql(`alter table "rental_booking" add column "blocked_during" daterange generated always as (daterange((blocked_start at time zone 'UTC')::date, (blocked_end at time zone 'UTC')::date, '[]')) stored;`);
    this.addSql(`alter table "rental_booking" add constraint "rental_booking_dates_ok" check (blocked_start <= rental_start and rental_start <= rental_end and rental_end <= blocked_end);`);
    this.addSql(`alter table "rental_booking" add constraint "rental_booking_hold_has_expiry" check (status <> 'held' or hold_expires_at is not null);`);
    this.addSql(`alter table "rental_booking" add constraint "rental_booking_days_ok" check (days >= 1);`);
    this.addSql(`alter table "rental_booking" add constraint "rental_booking_amounts_ok" check (rental_fee >= 0 and cleaning_fee >= 0 and deposit_amount >= 0 and platform_fee >= 0);`);
    this.addSql(`alter table "rental_booking" add constraint "rental_booking_no_overlap" exclude using gist (unit_id with =, blocked_during with &&) where (status in ('held', 'confirmed', 'with_customer', 'returned', 'settling', 'disputed') and deleted_at is null);`);

    this.addSql(`alter table "rental_block" add column "blocked_during" daterange generated always as (daterange((start_date at time zone 'UTC')::date, (end_date at time zone 'UTC')::date, '[]')) stored;`);
    this.addSql(`alter table "rental_block" add constraint "rental_block_dates_ok" check (start_date <= end_date);`);
    this.addSql(`alter table "rental_block" add constraint "rental_block_no_overlap" exclude using gist (unit_id with =, blocked_during with &&) where (deleted_at is null);`);

    this.addSql(`alter table "rental_deposit" add constraint "rental_deposit_amounts_ok" check (captured_amount + released_amount <= amount);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "rental_deposit" drop constraint if exists "rental_deposit_booking_id_foreign";`);

    this.addSql(`alter table if exists "rental_booking_event" drop constraint if exists "rental_booking_event_booking_id_foreign";`);

    this.addSql(`drop table if exists "rental_booking" cascade;`);

    this.addSql(`drop table if exists "rental_deposit" cascade;`);

    this.addSql(`drop table if exists "rental_booking_event" cascade;`);

    this.addSql(`drop table if exists "rental_block" cascade;`);
  }

}
