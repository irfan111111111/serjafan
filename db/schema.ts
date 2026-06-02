import { relations } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())
    .notNull()
};

export const user = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
    image: text("image"),
    role: text("role", { enum: ["CUSTOMER", "PARTNER", "ADMIN"] }).notNull().default("CUSTOMER"),
    ...timestamps
  },
  (table) => [uniqueIndex("user_email_unique").on(table.email)]
);

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ...timestamps
  },
  (table) => [uniqueIndex("session_token_unique").on(table.token), index("session_user_id_idx").on(table.userId)]
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),
    ...timestamps
  },
  (table) => [index("account_user_id_idx").on(table.userId)]
);

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdateFn(() => new Date())
});

export const partnerProfiles = sqliteTable(
  "partner_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    category: text("category").notNull(),
    distanceKm: real("distance_km").notNull().default(0),
    rating: real("rating").notNull().default(0),
    reviewCount: integer("review_count").notNull().default(0),
    completedOrders: integer("completed_orders").notNull().default(0),
    etaMinutes: integer("eta_minutes").notNull().default(15),
    priceFrom: integer("price_from").notNull().default(0),
    status: text("status", { enum: ["ONLINE", "BUSY", "OFFLINE"] }).notNull().default("ONLINE"),
    verificationStatus: text("verification_status", { enum: ["PENDING", "APPROVED", "REJECTED"] })
      .notNull()
      .default("PENDING"),
    verified: integer("verified", { mode: "boolean" }).notNull().default(false),
    ...timestamps
  },
  (table) => [index("partner_verification_status_idx").on(table.verificationStatus)]
);

export const addresses = sqliteTable(
  "addresses",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull(),
    latitude: real("latitude"),
    longitude: real("longitude"),
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
    ...timestamps
  },
  (table) => [index("addresses_user_id_idx").on(table.userId)]
);

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    partnerId: text("partner_id")
      .notNull()
      .references(() => partnerProfiles.id, { onDelete: "restrict" }),
    serviceCategoryId: text("service_category_id").notNull(),
    addressTitle: text("address_title").notNull(),
    addressSubtitle: text("address_subtitle").notNull(),
    scheduleType: text("schedule_type").notNull().default("ASAP"),
    scheduleTitle: text("schedule_title").notNull(),
    scheduleSubtitle: text("schedule_subtitle").notNull(),
    note: text("note"),
    paymentMethod: text("payment_method", { enum: ["SERJAFAN_PAY", "CARD", "CASH"] }).notNull(),
    promoCode: text("promo_code"),
    serviceFee: integer("service_fee").notNull(),
    platformFee: integer("platform_fee").notNull(),
    discount: integer("discount").notNull().default(0),
    total: integer("total").notNull(),
    status: text("status", {
      enum: ["PENDING", "CONFIRMED", "PARTNER_READY", "ON_THE_WAY", "DONE", "CANCELLED"]
    })
      .notNull()
      .default("PENDING"),
    ...timestamps
  },
  (table) => [
    index("orders_customer_id_idx").on(table.customerId),
    index("orders_partner_id_idx").on(table.partnerId),
    index("orders_status_idx").on(table.status)
  ]
);

export const orderTrackingEvents = sqliteTable(
  "order_tracking_events",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull()
  },
  (table) => [index("tracking_order_id_idx").on(table.orderId)]
);

export const wallets = sqliteTable(
  "wallets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    balance: integer("balance").notNull().default(0),
    currency: text("currency").notNull().default("IDR"),
    ...timestamps
  },
  (table) => [uniqueIndex("wallet_user_id_unique").on(table.userId)]
);

export const walletTransactions = sqliteTable(
  "wallet_transactions",
  {
    id: text("id").primaryKey(),
    walletId: text("wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
    type: text("type", { enum: ["TOPUP", "PAYMENT", "EARNING", "WITHDRAWAL", "REFUND"] }).notNull(),
    amount: integer("amount").notNull(),
    description: text("description").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull()
  },
  (table) => [index("wallet_transactions_wallet_id_idx").on(table.walletId)]
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["ORDER", "PROMO", "MESSAGE", "SYSTEM"] }).notNull().default("SYSTEM"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    targetUrl: text("target_url"),
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
    ...timestamps
  },
  (table) => [index("notifications_user_id_idx").on(table.userId), index("notifications_is_read_idx").on(table.isRead)]
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sender: text("sender").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    unread: integer("unread", { mode: "boolean" }).notNull().default(true),
    ...timestamps
  },
  (table) => [index("messages_user_id_idx").on(table.userId), index("messages_unread_idx").on(table.unread)]
);

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())
    .notNull()
});

export const verificationAuditLogs = sqliteTable(
  "verification_audit_logs",
  {
    id: text("id").primaryKey(),
    partnerId: text("partner_id")
      .notNull()
      .references(() => partnerProfiles.id, { onDelete: "cascade" }),
    adminId: text("admin_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: text("action", { enum: ["APPROVED", "REJECTED"] }).notNull(),
    reason: text("reason"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull()
  },
  (table) => [index("verification_audit_partner_id_idx").on(table.partnerId)]
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  orders: many(orders),
  addresses: many(addresses),
  wallets: many(wallets)
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] })
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] })
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
  customer: one(user, { fields: [orders.customerId], references: [user.id] }),
  partner: one(partnerProfiles, { fields: [orders.partnerId], references: [partnerProfiles.id] }),
  trackingEvents: many(orderTrackingEvents)
}));

export const walletRelations = relations(wallets, ({ one, many }) => ({
  user: one(user, { fields: [wallets.userId], references: [user.id] }),
  transactions: many(walletTransactions)
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(user, { fields: [notifications.userId], references: [user.id] })
}));

export const messageRelations = relations(messages, ({ one }) => ({
  user: one(user, { fields: [messages.userId], references: [user.id] })
}));

export const schema = {
  user,
  session,
  account,
  verification,
  partnerProfiles,
  addresses,
  orders,
  orderTrackingEvents,
  wallets,
  walletTransactions,
  notifications,
  messages,
  appSettings,
  verificationAuditLogs
};
