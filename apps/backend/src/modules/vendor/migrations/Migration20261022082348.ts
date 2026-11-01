import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261022082348 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vendor_user" drop constraint if exists "vendor_user_email_unique";`);
    this.addSql(`alter table if exists "vendor_user" drop constraint if exists "vendor_user_auth_identity_id_unique";`);
    this.addSql(`alter table if exists "vendor" drop constraint if exists "vendor_email_unique";`);
    this.addSql(`alter table if exists "vendor" drop constraint if exists "vendor_handle_unique";`);
    this.addSql(`create table if not exists "vendor" ("id" text not null, "name" text not null, "handle" text not null, "email" text not null, "phone" text not null, "whatsapp" text null, "city" text not null, "address" text null, "description" text null, "logo_key" text null, "instagram_handle" text null, "status" text check ("status" in ('pending', 'active', 'suspended', 'rejected')) not null default 'pending', "kyc_status" text check ("kyc_status" in ('not_submitted', 'submitted', 'verified', 'rejected')) not null default 'not_submitted', "kyc_document_keys" text[] null, "commission_bps" integer not null default 1200, "default_cancellation_policy" text check ("default_cancellation_policy" in ('flexible', 'standard', 'strict')) not null default 'standard', "payout_method" text check ("payout_method" in ('bank_transfer', 'jazzcash', 'easypaisa')) null, "payout_account_ref" text null, "cancellations_90d" integer not null default 0, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vendor_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_vendor_handle_unique" ON "vendor" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_vendor_email_unique" ON "vendor" ("email") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vendor_deleted_at" ON "vendor" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`alter table if exists "vendor" add constraint "vendor_commission_bps_check" check ("commission_bps" between 0 and 3000);`);

    this.addSql(`create table if not exists "vendor_user" ("id" text not null, "vendor_id" text not null, "auth_identity_id" text not null, "name" text not null, "email" text not null, "role" text check ("role" in ('owner', 'staff')) not null default 'owner', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vendor_user_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vendor_user_vendor_id" ON "vendor_user" ("vendor_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_vendor_user_auth_identity_id_unique" ON "vendor_user" ("auth_identity_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_vendor_user_email_unique" ON "vendor_user" ("email") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vendor_user_deleted_at" ON "vendor_user" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "vendor_user" add constraint "vendor_user_vendor_id_foreign" foreign key ("vendor_id") references "vendor" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "vendor_user" drop constraint if exists "vendor_user_vendor_id_foreign";`);

    this.addSql(`drop table if exists "vendor" cascade;`);

    this.addSql(`drop table if exists "vendor_user" cascade;`);
  }

}
