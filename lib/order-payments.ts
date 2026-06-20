import { client } from "@/db";

let ready: Promise<void> | null = null;

const orderPaymentColumns = [
  "ALTER TABLE orders ADD COLUMN payment_status text DEFAULT 'PENDING' NOT NULL",
  "ALTER TABLE orders ADD COLUMN payment_proof_image text",
  "ALTER TABLE orders ADD COLUMN payment_sender_name text",
  "ALTER TABLE orders ADD COLUMN payment_reference text"
];

export function ensureOrderPaymentColumns() {
  ready ??= (async () => {
    for (const statement of orderPaymentColumns) {
      try {
        await client.execute(statement);
      } catch {
        // Columns already exist after the first production run.
      }
    }
  })();
  return ready;
}
