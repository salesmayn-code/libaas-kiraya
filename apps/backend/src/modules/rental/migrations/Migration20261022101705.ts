import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261022101705 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "rental_dispute" drop constraint if exists "rental_dispute_inspection_id_unique";`);
    this.addSql(`alter table if exists "rental_inspection" drop constraint if exists "rental_inspection_booking_id_unique";`);
    this.addSql(`create table if not exists "rental_inspection" ("id" text not null, "booking_id" text not null, "filed_by" text not null, "outcome" text check ("outcome" in ('clean', 'minor_damage', 'major_damage', 'loss')) not null, "damage_deduction" numeric not null default 0, "late_days" integer not null default 0, "late_fee" numeric not null default 0, "total_deduction" numeric not null, "notes" text null, "photo_keys" text[] not null, "status" text check ("status" in ('submitted', 'needs_admin_review', 'accepted', 'auto_accepted', 'disputed', 'resolved')) not null default 'submitted', "submitted_at" timestamptz not null, "dispute_deadline" timestamptz not null, "decided_at" timestamptz null, "raw_damage_deduction" jsonb not null default '{"value":"0","precision":20}', "raw_late_fee" jsonb not null default '{"value":"0","precision":20}', "raw_total_deduction" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rental_inspection_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rental_inspection_booking_id_unique" ON "rental_inspection" ("booking_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_inspection_deleted_at" ON "rental_inspection" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_inspection_status_dispute_deadline" ON "rental_inspection" ("status", "dispute_deadline") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rental_dispute" ("id" text not null, "inspection_id" text not null, "booking_id" text not null, "opened_by" text not null, "reason" text not null, "evidence_keys" text[] null, "status" text check ("status" in ('open', 'under_review', 'resolved')) not null default 'open', "resolution" text check ("resolution" in ('customer', 'vendor', 'split')) null, "resolved_deduction" numeric null, "admin_notes" text null, "resolved_by" text null, "opened_at" timestamptz not null, "resolved_at" timestamptz null, "raw_resolved_deduction" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rental_dispute_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rental_dispute_inspection_id_unique" ON "rental_dispute" ("inspection_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rental_dispute_deleted_at" ON "rental_dispute" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "rental_inspection" add constraint "rental_inspection_booking_id_foreign" foreign key ("booking_id") references "rental_booking" ("id") on update cascade;`);

    this.addSql(`alter table if exists "rental_dispute" add constraint "rental_dispute_inspection_id_foreign" foreign key ("inspection_id") references "rental_inspection" ("id") on update cascade;`);

    this.addSql(`alter table if exists "rental_inspection" add constraint "rental_inspection_amounts_ok" check ("damage_deduction" >= 0 and "late_fee" >= 0 and "total_deduction" >= 0 and "late_days" >= 0);`);
    this.addSql(`alter table if exists "rental_dispute" add constraint "rental_dispute_deduction_ok" check ("resolved_deduction" is null or "resolved_deduction" >= 0);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "rental_dispute" drop constraint if exists "rental_dispute_inspection_id_foreign";`);

    this.addSql(`drop table if exists "rental_inspection" cascade;`);

    this.addSql(`drop table if exists "rental_dispute" cascade;`);
  }

}
