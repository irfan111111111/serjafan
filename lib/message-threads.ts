import { client } from "@/db";

let ready: Promise<void> | null = null;

const messageThreadColumns = [
  "ALTER TABLE messages ADD COLUMN order_id text",
  "ALTER TABLE messages ADD COLUMN partner_id text",
  "ALTER TABLE messages ADD COLUMN partner_name text",
  "ALTER TABLE messages ADD COLUMN service_name text",
  "ALTER TABLE messages ADD COLUMN attachment_image text"
];

export function ensureMessageThreadColumns() {
  ready ??= (async () => {
    for (const statement of messageThreadColumns) {
      try {
        await client.execute(statement);
      } catch {
        // Columns already exist after the first production run.
      }
    }
  })();
  return ready;
}
