import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261022102400 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "ledger_entry" drop constraint if exists "ledger_entry_idempotency_key_unique";`);
    this.addSql(`create table if not exists "payout" ("id" text not null, "vendor_id" text not null, "amount" numeric not null, "currency_code" text not null, "method" text check ("method" in ('bank_transfer', 'jazzcash', 'easypaisa')) not null, "reference" text null, "status" text check ("status" in ('draft', 'approved', 'paid', 'failed')) not null default 'draft', "period_start" timestamptz not null, "period_end" timestamptz not null, "approved_by" text null, "approved_at" timestamptz null, "paid_at" timestamptz null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payout_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_deleted_at" ON "payout" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_vendor_id_status" ON "payout" ("vendor_id", "status") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ledger_entry" ("id" text not null, "vendor_id" text not null, "booking_id" text null, "payout_id" text not null, "type" text check ("type" in ('rental_earning', 'commission', 'cleaning_fee', 'deduction_earning', 'refund_reversal', 'penalty', 'adjustment', 'payout')) not null, "amount" numeric not null, "currency_code" text not null, "status" text check ("status" in ('pending', 'available', 'paid', 'reversed')) not null default 'pending', "available_at" timestamptz null, "idempotency_key" text not null, "memo" text null, "metadata" jsonb null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ledger_entry_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ledger_entry_payout_id" ON "ledger_entry" ("payout_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ledger_entry_idempotency_key_unique" ON "ledger_entry" ("idempotency_key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ledger_entry_deleted_at" ON "ledger_entry" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ledger_entry_vendor_id_status" ON "ledger_entry" ("vendor_id", "status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ledger_entry_booking_id" ON "ledger_entry" ("booking_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "ledger_entry" add constraint "ledger_entry_payout_id_foreign" foreign key ("payout_id") references "payout" ("id") on update cascade;`);

    this.addSql(`alter table if exists "ledger_entry" add constraint "ledger_entry_amount_nonzero" check ("amount" <> 0);`);
    this.addSql(`alter table if exists "payout" add constraint "payout_amount_nonnegative" check ("amount" >= 0);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "ledger_entry" drop constraint if exists "ledger_entry_payout_id_foreign";`);

    this.addSql(`drop table if exists "payout" cascade;`);

    this.addSql(`drop table if exists "ledger_entry" cascade;`);
  }

}
