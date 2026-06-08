import { eq } from "drizzle-orm";
import { client, db } from "@/db";
import { notificationPreferences } from "@/db/schema";
import { createId, fail, ok, readJson, requireSession } from "@/lib/api";

export const runtime = "nodejs";

type NotificationTone = "classic" | "soft" | "urgent" | "custom";

type PreferenceBody = {
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  soundTone?: NotificationTone;
  customRingtoneName?: string;
  customRingtoneData?: string;
};

const allowedTones: NotificationTone[] = ["classic", "soft", "urgent", "custom"];

const defaultPreferences = {
  soundEnabled: true,
  vibrationEnabled: true,
  soundTone: "classic" as NotificationTone,
  customRingtoneName: null as string | null,
  customRingtoneData: null as string | null
};

let tableReady: Promise<void> | null = null;

function ensurePreferenceTable() {
  tableReady ??= (async () => {
    await client.batch(
      [
        `CREATE TABLE IF NOT EXISTS notification_preferences (
          id text PRIMARY KEY NOT NULL,
          user_id text NOT NULL,
          sound_enabled integer DEFAULT true NOT NULL,
          vibration_enabled integer DEFAULT true NOT NULL,
          sound_tone text DEFAULT 'classic' NOT NULL,
          custom_ringtone_name text,
          custom_ringtone_data text,
          created_at integer NOT NULL,
          updated_at integer NOT NULL,
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE cascade
        )`,
        "CREATE UNIQUE INDEX IF NOT EXISTS notification_preferences_user_unique ON notification_preferences (user_id)"
      ],
      "write"
    );
    for (const statement of ["ALTER TABLE notification_preferences ADD COLUMN custom_ringtone_name text", "ALTER TABLE notification_preferences ADD COLUMN custom_ringtone_data text"]) {
      try {
        await client.execute(statement);
      } catch {
        // Columns already exist after the first run.
      }
    }
  })();
  return tableReady;
}

async function ensurePreferences(userId: string) {
  await ensurePreferenceTable();
  let preferences = await db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.userId, userId)
  });
  if (preferences) return preferences;

  const now = new Date();
  const id = createId("npr");
  await db.insert(notificationPreferences).values({
    id,
    userId,
    ...defaultPreferences,
    createdAt: now,
    updatedAt: now
  });

  preferences = await db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.id, id)
  });
  if (!preferences) throw new Error("Preferensi notifikasi gagal dibuat.");
  return preferences;
}

export async function GET() {
  const { session, response } = await requireSession();
  if (response || !session) return response;

  await ensurePreferenceTable();
  const preferences = await ensurePreferences(session.user.id);
  return ok({ preferences });
}

export async function PUT(request: Request) {
  const { session, response } = await requireSession();
  if (response || !session) return response;

  const body = await readJson<PreferenceBody>(request);
  if (!body) return fail("Invalid JSON body.");

  await ensurePreferenceTable();
  const existing = await ensurePreferences(session.user.id);
  const soundTone = body.soundTone && allowedTones.includes(body.soundTone) ? body.soundTone : existing.soundTone;
  const customRingtoneName =
    typeof body.customRingtoneName === "string" ? body.customRingtoneName.trim().slice(0, 80) || null : existing.customRingtoneName;
  const customRingtoneData =
    typeof body.customRingtoneData === "string" && (body.customRingtoneData.startsWith("data:audio/") || body.customRingtoneData.startsWith("https://"))
      ? body.customRingtoneData.startsWith("data:audio/")
        ? body.customRingtoneData.slice(0, 3_600_000)
        : body.customRingtoneData
      : existing.customRingtoneData;
  const now = new Date();

  await db
    .update(notificationPreferences)
    .set({
      soundEnabled: typeof body.soundEnabled === "boolean" ? body.soundEnabled : existing.soundEnabled,
      vibrationEnabled: typeof body.vibrationEnabled === "boolean" ? body.vibrationEnabled : existing.vibrationEnabled,
      soundTone,
      customRingtoneName,
      customRingtoneData,
      updatedAt: now
    })
    .where(eq(notificationPreferences.id, existing.id));

  const preferences = await db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.id, existing.id)
  });

  return ok({ preferences });
}
