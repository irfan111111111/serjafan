import { client } from "@/db";

let ready: Promise<void> | null = null;

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS user (
    id text PRIMARY KEY NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    email_verified integer DEFAULT false NOT NULL,
    image text,
    role text DEFAULT 'CUSTOMER' NOT NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS user_email_unique ON user (email)`,
  `CREATE TABLE IF NOT EXISTS account (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    account_id text NOT NULL,
    provider_id text NOT NULL,
    access_token text,
    refresh_token text,
    access_token_expires_at integer,
    refresh_token_expires_at integer,
    scope text,
    id_token text,
    password text,
    created_at integer NOT NULL,
    updated_at integer NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE cascade
  )`,
  `CREATE INDEX IF NOT EXISTS account_user_id_idx ON account (user_id)`,
  `CREATE TABLE IF NOT EXISTS wallets (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    balance integer DEFAULT 0 NOT NULL,
    currency text DEFAULT 'IDR' NOT NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE cascade
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS wallet_user_id_unique ON wallets (user_id)`,
  `CREATE TABLE IF NOT EXISTS addresses (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    title text NOT NULL,
    subtitle text NOT NULL,
    latitude real,
    longitude real,
    is_default integer DEFAULT false NOT NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE cascade
  )`,
  `CREATE INDEX IF NOT EXISTS addresses_user_id_idx ON addresses (user_id)`,
  `CREATE TABLE IF NOT EXISTS partner_profiles (
    id text PRIMARY KEY NOT NULL,
    user_id text,
    name text NOT NULL,
    category text NOT NULL,
    distance_km real DEFAULT 0 NOT NULL,
    rating real DEFAULT 0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    completed_orders integer DEFAULT 0 NOT NULL,
    eta_minutes integer DEFAULT 15 NOT NULL,
    price_from integer DEFAULT 0 NOT NULL,
    payment_bank_name text,
    payment_bank_account text,
    payment_bank_holder text,
    payment_dana_number text,
    payment_dana_name text,
    accepts_cash integer DEFAULT true NOT NULL,
    status text DEFAULT 'OFFLINE' NOT NULL,
    verification_status text DEFAULT 'PENDING' NOT NULL,
    verified integer DEFAULT false NOT NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE set null
  )`,
  `CREATE INDEX IF NOT EXISTS partner_verification_status_idx ON partner_profiles (verification_status)`,
  `CREATE TABLE IF NOT EXISTS partner_registration_documents (
    id text PRIMARY KEY NOT NULL,
    partner_id text NOT NULL,
    type text NOT NULL,
    label text NOT NULL,
    value text NOT NULL,
    status text DEFAULT 'PENDING' NOT NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL,
    FOREIGN KEY (partner_id) REFERENCES partner_profiles(id) ON DELETE cascade
  )`,
  `CREATE INDEX IF NOT EXISTS partner_documents_partner_id_idx ON partner_registration_documents (partner_id)`
  ,
  `CREATE TABLE IF NOT EXISTS partner_activation_tokens (
    id text PRIMARY KEY NOT NULL,
    partner_id text NOT NULL,
    token_hash text NOT NULL,
    token_last4 text NOT NULL,
    active integer DEFAULT true NOT NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL,
    FOREIGN KEY (partner_id) REFERENCES partner_profiles(id) ON DELETE cascade
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS partner_activation_partner_unique ON partner_activation_tokens (partner_id)`,
  `CREATE TABLE IF NOT EXISTS orders (
    id text PRIMARY KEY NOT NULL,
    customer_id text NOT NULL,
    partner_id text NOT NULL,
    service_category_id text NOT NULL,
    address_title text NOT NULL,
    address_subtitle text NOT NULL,
    schedule_type text DEFAULT 'ASAP' NOT NULL,
    schedule_title text NOT NULL,
    schedule_subtitle text NOT NULL,
    note text,
    payment_method text NOT NULL,
    payment_status text DEFAULT 'PENDING' NOT NULL,
    payment_proof_image text,
    payment_sender_name text,
    payment_reference text,
    promo_code text,
    service_fee integer NOT NULL,
    platform_fee integer NOT NULL,
    discount integer DEFAULT 0 NOT NULL,
    total integer NOT NULL,
    status text DEFAULT 'PENDING' NOT NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES user(id) ON DELETE cascade,
    FOREIGN KEY (partner_id) REFERENCES partner_profiles(id) ON DELETE restrict
  )`,
  `CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON orders (customer_id)`,
  `CREATE INDEX IF NOT EXISTS orders_partner_id_idx ON orders (partner_id)`,
  `CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status)`,
  `CREATE TABLE IF NOT EXISTS order_tracking_events (
    id text PRIMARY KEY NOT NULL,
    order_id text NOT NULL,
    status text NOT NULL,
    title text NOT NULL,
    description text,
    latitude real,
    longitude real,
    created_at integer NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE cascade
  )`,
  `CREATE INDEX IF NOT EXISTS tracking_order_id_idx ON order_tracking_events (order_id)`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    kind text DEFAULT 'SYSTEM' NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    target_url text,
    is_read integer DEFAULT false NOT NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE cascade
  )`,
  `CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications (user_id)`,
  `CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications (is_read)`,
  `CREATE TABLE IF NOT EXISTS notification_preferences (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    sound_enabled integer DEFAULT true NOT NULL,
    vibration_enabled integer DEFAULT true NOT NULL,
    sound_tone text DEFAULT 'classic' NOT NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE cascade
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS notification_preferences_user_unique ON notification_preferences (user_id)`,
  `CREATE TABLE IF NOT EXISTS messages (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    sender text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    unread integer DEFAULT true NOT NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE cascade
  )`,
  `CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages (user_id)`,
  `CREATE INDEX IF NOT EXISTS messages_unread_idx ON messages (unread)`,
  `CREATE TABLE IF NOT EXISTS wallet_transactions (
    id text PRIMARY KEY NOT NULL,
    wallet_id text NOT NULL,
    order_id text,
    type text NOT NULL,
    amount integer NOT NULL,
    description text NOT NULL,
    created_at integer NOT NULL,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE cascade,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE set null
  )`,
  `CREATE INDEX IF NOT EXISTS wallet_transactions_wallet_id_idx ON wallet_transactions (wallet_id)`,
  `CREATE TABLE IF NOT EXISTS payment_intents (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    wallet_id text NOT NULL,
    provider text NOT NULL,
    provider_reference text,
    channel text NOT NULL,
    amount integer NOT NULL,
    status text DEFAULT 'PENDING' NOT NULL,
    checkout_url text,
    qr_string text,
    raw_payload text,
    created_at integer NOT NULL,
    updated_at integer NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE cascade,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE cascade
  )`,
  `CREATE INDEX IF NOT EXISTS payment_intents_user_id_idx ON payment_intents (user_id)`,
  `CREATE INDEX IF NOT EXISTS payment_intents_wallet_id_idx ON payment_intents (wallet_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS payment_intents_provider_reference_unique ON payment_intents (provider_reference)`,
  `CREATE TABLE IF NOT EXISTS verification_audit_logs (
    id text PRIMARY KEY NOT NULL,
    partner_id text NOT NULL,
    admin_id text NOT NULL,
    action text NOT NULL,
    reason text,
    created_at integer NOT NULL,
    FOREIGN KEY (partner_id) REFERENCES partner_profiles(id) ON DELETE cascade,
    FOREIGN KEY (admin_id) REFERENCES user(id) ON DELETE cascade
  )`,
  `CREATE INDEX IF NOT EXISTS verification_audit_partner_id_idx ON verification_audit_logs (partner_id)`,
  `CREATE TABLE IF NOT EXISTS app_settings (
    key text PRIMARY KEY NOT NULL,
    value text NOT NULL,
    updated_at integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id text PRIMARY KEY NOT NULL,
    actor_id text,
    actor_role text,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    severity text DEFAULT 'INFO' NOT NULL,
    ip_address text,
    user_agent text,
    metadata text,
    created_at integer NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx ON audit_logs (actor_id)`,
  `CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs (action)`,
  `CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity_type, entity_id)`,
  `CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at)`,
  `CREATE TABLE IF NOT EXISTS error_logs (
    id text PRIMARY KEY NOT NULL,
    source text NOT NULL,
    message text NOT NULL,
    stack text,
    severity text DEFAULT 'ERROR' NOT NULL,
    request_path text,
    actor_id text,
    metadata text,
    resolved integer DEFAULT false NOT NULL,
    created_at integer NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS error_logs_source_idx ON error_logs (source)`,
  `CREATE INDEX IF NOT EXISTS error_logs_severity_idx ON error_logs (severity)`,
  `CREATE INDEX IF NOT EXISTS error_logs_resolved_idx ON error_logs (resolved)`,
  `CREATE INDEX IF NOT EXISTS error_logs_created_at_idx ON error_logs (created_at)`,
  `CREATE TABLE IF NOT EXISTS fraud_flags (
    id text PRIMARY KEY NOT NULL,
    user_id text,
    entity_type text NOT NULL,
    entity_id text,
    reason text NOT NULL,
    risk_score integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'OPEN' NOT NULL,
    metadata text,
    created_at integer NOT NULL,
    updated_at integer NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS fraud_flags_user_id_idx ON fraud_flags (user_id)`,
  `CREATE INDEX IF NOT EXISTS fraud_flags_entity_idx ON fraud_flags (entity_type, entity_id)`,
  `CREATE INDEX IF NOT EXISTS fraud_flags_status_idx ON fraud_flags (status)`,
  `CREATE INDEX IF NOT EXISTS fraud_flags_risk_score_idx ON fraud_flags (risk_score)`,
  `CREATE TABLE IF NOT EXISTS session (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    token text NOT NULL,
    expires_at integer NOT NULL,
    ip_address text,
    user_agent text,
    created_at integer NOT NULL,
    updated_at integer NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE cascade
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS session_token_unique ON session (token)`,
  `CREATE INDEX IF NOT EXISTS session_user_id_idx ON session (user_id)`,
  `CREATE TABLE IF NOT EXISTS verification (
    id text PRIMARY KEY NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    expires_at integer NOT NULL,
    created_at integer,
    updated_at integer
  )`,
  `ALTER TABLE notification_preferences ADD COLUMN custom_ringtone_name text`,
  `ALTER TABLE notification_preferences ADD COLUMN custom_ringtone_data text`,
  `ALTER TABLE messages ADD COLUMN order_id text`,
  `ALTER TABLE messages ADD COLUMN partner_id text`,
  `ALTER TABLE messages ADD COLUMN partner_name text`,
  `ALTER TABLE messages ADD COLUMN service_name text`,
  `ALTER TABLE messages ADD COLUMN attachment_image text`,
  `CREATE INDEX IF NOT EXISTS messages_order_id_idx ON messages (order_id)`,
  `CREATE INDEX IF NOT EXISTS messages_partner_id_idx ON messages (partner_id)`
];

export async function ensureRegistrationDatabase() {
  if (!ready) {
    ready = (async () => {
      for (const statement of schemaStatements) {
        try {
          await client.execute(statement);
        } catch (error) {
          if (!String(error).toLowerCase().includes("duplicate column name")) {
            throw error;
          }
        }
      }
    })();
  }
  return ready;
}
