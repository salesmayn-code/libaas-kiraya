import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261022103919 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "ledger_entry" drop constraint if exists "ledger_entry_payout_id_foreign";`);

    this.addSql(`drop index if exists "IDX_ledger_entry_payout_id";`);

    this.addSql(`alter table if exists "ledger_entry" alter column "payout_id" type text using ("payout_id"::text);`);
    this.addSql(`alter table if exists "ledger_entry" alter column "payout_id" drop not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "ledger_entry" alter column "payout_id" type text using ("payout_id"::text);`);
    this.addSql(`alter table if exists "ledger_entry" alter column "payout_id" set not null;`);
    this.addSql(`alter table if exists "ledger_entry" add constraint "ledger_entry_payout_id_foreign" foreign key ("payout_id") references "payout" ("id") on update cascade;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ledger_entry_payout_id" ON "ledger_entry" ("payout_id") WHERE deleted_at IS NULL;`);
  }

}
