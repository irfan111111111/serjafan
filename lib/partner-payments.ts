import { client } from "@/db";

let ready: Promise<void> | null = null;

const partnerPaymentColumns = [
  "ALTER TABLE partner_profiles ADD COLUMN payment_bank_name text",
  "ALTER TABLE partner_profiles ADD COLUMN payment_bank_account text",
  "ALTER TABLE partner_profiles ADD COLUMN payment_bank_holder text",
  "ALTER TABLE partner_profiles ADD COLUMN payment_dana_number text",
  "ALTER TABLE partner_profiles ADD COLUMN payment_dana_name text",
  "ALTER TABLE partner_profiles ADD COLUMN accepts_cash integer DEFAULT true NOT NULL"
];

export function ensurePartnerPaymentColumns() {
  ready ??= (async () => {
    for (const statement of partnerPaymentColumns) {
      try {
        await client.execute(statement);
      } catch {
        // Column already exists on production databases after the first migration.
      }
    }
  })();
  return ready;
}
