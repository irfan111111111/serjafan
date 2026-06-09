import { config } from "dotenv";

config({ path: ".env.production.local", override: true });
config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

type CountRow = { total: number };
type IdRow = { id: string };
type SqlArg = string | number | null;

const confirm = process.argv.includes("--confirm");

const inClause = (values: string[]) => values.map(() => "?").join(", ");

const ids = (rows: IdRow[]) => rows.map((row) => row.id);

const count = async (client: Awaited<typeof import("../db/index")>["client"], table: string, where?: string, args: SqlArg[] = []) => {
  const result = await client.execute({
    sql: `select count(*) as total from ${table}${where ? ` where ${where}` : ""}`,
    args
  });
  return Number(((result.rows[0] as unknown as CountRow | undefined)?.total) ?? 0);
};

const deleteWhere = async (
  client: Awaited<typeof import("../db/index")>["client"],
  table: string,
  where: string,
  args: SqlArg[]
) => {
  if (!args.length && where.includes("?")) return 0;
  const result = await client.execute({ sql: `delete from ${table} where ${where}`, args });
  return result.rowsAffected;
};

const selectIds = async (
  client: Awaited<typeof import("../db/index")>["client"],
  table: string,
  where?: string,
  args: SqlArg[] = []
) => {
  const result = await client.execute({
    sql: `select id from ${table}${where ? ` where ${where}` : ""}`,
    args
  });
  return ids(result.rows as unknown as IdRow[]);
};

const main = async () => {
  if (!process.env.TURSO_DATABASE_URL && !process.env.DATABASE_URL && !process.env.DB_FILE_NAME) {
    throw new Error("Database env tidak ditemukan. Jalankan `npx vercel env pull .env.production.local` dulu.");
  }

  const { client } = await import("../db/index");

  const userIds = await selectIds(client, "user", "role in ('CUSTOMER', 'PARTNER')");
  const partnerIds = await selectIds(client, "partner_profiles");
  const walletIds = userIds.length ? await selectIds(client, "wallets", `user_id in (${inClause(userIds)})`, userIds) : [];
  const orderFilter = [
    userIds.length ? `customer_id in (${inClause(userIds)})` : "",
    partnerIds.length ? `partner_id in (${inClause(partnerIds)})` : ""
  ]
    .filter(Boolean)
    .join(" or ");
  const orderIds = orderFilter ? await selectIds(client, "orders", orderFilter, [...userIds, ...partnerIds]) : [];

  const before = {
    users: userIds.length,
    partnerProfiles: partnerIds.length,
    orders: orderIds.length,
    wallets: walletIds.length,
    messages: await count(
      client,
      "messages",
      [
        userIds.length ? `user_id in (${inClause(userIds)})` : "",
        partnerIds.length ? `partner_id in (${inClause(partnerIds)})` : "",
        orderIds.length ? `order_id in (${inClause(orderIds)})` : ""
      ]
        .filter(Boolean)
        .join(" or ") || "1 = 0",
      [...userIds, ...partnerIds, ...orderIds]
    ),
    notifications: userIds.length ? await count(client, "notifications", `user_id in (${inClause(userIds)})`, userIds) : 0,
    paymentIntents: userIds.length ? await count(client, "payment_intents", `user_id in (${inClause(userIds)})`, userIds) : 0,
    walletTransactions: walletIds.length
      ? await count(client, "wallet_transactions", `wallet_id in (${inClause(walletIds)})`, walletIds)
      : 0
  };

  console.log(JSON.stringify({ mode: confirm ? "delete" : "dry-run", target: "CUSTOMER_AND_PARTNER_ONLY", before }, null, 2));

  if (!confirm) {
    console.log("Dry-run selesai. Tambahkan --confirm untuk benar-benar menghapus.");
    client.close();
    return;
  }

  if (orderIds.length) {
    await deleteWhere(client, "order_tracking_events", `order_id in (${inClause(orderIds)})`, orderIds);
  }

  await deleteWhere(
    client,
    "messages",
    [
      userIds.length ? `user_id in (${inClause(userIds)})` : "",
      partnerIds.length ? `partner_id in (${inClause(partnerIds)})` : "",
      orderIds.length ? `order_id in (${inClause(orderIds)})` : ""
    ]
      .filter(Boolean)
      .join(" or ") || "1 = 0",
    [...userIds, ...partnerIds, ...orderIds]
  );

  if (orderIds.length) await deleteWhere(client, "orders", `id in (${inClause(orderIds)})`, orderIds);
  if (partnerIds.length) {
    await deleteWhere(client, "partner_registration_documents", `partner_id in (${inClause(partnerIds)})`, partnerIds);
    await deleteWhere(client, "partner_activation_tokens", `partner_id in (${inClause(partnerIds)})`, partnerIds);
    await deleteWhere(client, "verification_audit_logs", `partner_id in (${inClause(partnerIds)})`, partnerIds);
    await deleteWhere(client, "partner_profiles", `id in (${inClause(partnerIds)})`, partnerIds);
  }
  if (userIds.length) {
    await deleteWhere(client, "notifications", `user_id in (${inClause(userIds)})`, userIds);
    await deleteWhere(client, "notification_preferences", `user_id in (${inClause(userIds)})`, userIds);
    await deleteWhere(client, "push_subscriptions", `user_id in (${inClause(userIds)})`, userIds);
    await deleteWhere(client, "payment_intents", `user_id in (${inClause(userIds)})`, userIds);
    await deleteWhere(client, "fraud_flags", `user_id in (${inClause(userIds)})`, userIds);
    await deleteWhere(client, "error_logs", `actor_id in (${inClause(userIds)})`, userIds);
  }
  if (walletIds.length) {
    await deleteWhere(client, "wallet_transactions", `wallet_id in (${inClause(walletIds)})`, walletIds);
    await deleteWhere(client, "wallets", `id in (${inClause(walletIds)})`, walletIds);
  }
  if (userIds.length) {
    await deleteWhere(client, "addresses", `user_id in (${inClause(userIds)})`, userIds);
    await deleteWhere(client, "session", `user_id in (${inClause(userIds)})`, userIds);
    await deleteWhere(client, "account", `user_id in (${inClause(userIds)})`, userIds);
    await deleteWhere(client, "user", `id in (${inClause(userIds)})`, userIds);
  }

  const after = {
    customerPartnerUsers: await count(client, "user", "role in ('CUSTOMER', 'PARTNER')"),
    partnerProfiles: await count(client, "partner_profiles"),
    orders: await count(client, "orders"),
    adminUsers: await count(client, "user", "role = 'ADMIN'")
  };

  console.log(JSON.stringify({ deleted: before, after }, null, 2));
  client.close();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
