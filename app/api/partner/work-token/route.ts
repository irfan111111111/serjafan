import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { partnerActivationTokens, partnerProfiles, wallets } from "@/db/schema";
import { createId, fail, ok, readJson, requireRole } from "@/lib/api";
import { ensureRegistrationDatabase } from "@/lib/db-bootstrap";

export const runtime = "nodejs";
const MIN_PARTNER_WORK_BALANCE = 20_000;

type TokenBody = {
  token?: string;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function GET() {
  const { session, response } = await requireRole(["PARTNER"]);
  if (response || !session) return response;

  await ensureRegistrationDatabase();

  const partner = await db.query.partnerProfiles.findFirst({
    where: eq(partnerProfiles.userId, session.user.id)
  });
  if (!partner) return fail("Partner profile not found.", 404);

  const activation = await db.query.partnerActivationTokens.findFirst({
    where: eq(partnerActivationTokens.partnerId, partner.id)
  });

  return ok({
    partner,
    token: activation
      ? {
          active: activation.active,
          last4: activation.tokenLast4,
          updatedAt: activation.updatedAt
        }
      : null
  });
}

export async function PUT(request: Request) {
  const { session, response } = await requireRole(["PARTNER"]);
  if (response || !session) return response;

  const body = await readJson<TokenBody>(request);
  const token = body?.token?.trim();
  if (!token) return fail("Token kerja wajib diisi.");
  if (token.length < 8) return fail("Token kerja minimal 8 karakter.");

  await ensureRegistrationDatabase();

  const partner = await db.query.partnerProfiles.findFirst({
    where: eq(partnerProfiles.userId, session.user.id)
  });
  if (!partner) return fail("Partner profile not found.", 404);

  const now = new Date();
  const existing = await db.query.partnerActivationTokens.findFirst({
    where: eq(partnerActivationTokens.partnerId, partner.id)
  });

  if (existing) {
    await db
      .update(partnerActivationTokens)
      .set({
        tokenHash: hashToken(token),
        tokenLast4: token.slice(-4),
        active: true,
        updatedAt: now
      })
      .where(eq(partnerActivationTokens.id, existing.id));
  } else {
    await db.insert(partnerActivationTokens).values({
      id: createId("ptok"),
      partnerId: partner.id,
      tokenHash: hashToken(token),
      tokenLast4: token.slice(-4),
      active: true,
      createdAt: now,
      updatedAt: now
    });
  }

  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, session.user.id)
  });
  const canWork = Boolean(wallet && wallet.balance >= MIN_PARTNER_WORK_BALANCE);

  const updatedPartner = (
    await db
      .update(partnerProfiles)
      .set({
        status: canWork ? "ONLINE" : "OFFLINE",
        verificationStatus: "APPROVED",
        verified: true,
        updatedAt: now
      })
      .where(eq(partnerProfiles.id, partner.id))
      .returning()
  )[0];

  return ok({
    partner: updatedPartner,
    token: {
      active: true,
      last4: token.slice(-4)
    },
    workEligibility: {
      canWork,
      minimumBalance: MIN_PARTNER_WORK_BALANCE,
      currentBalance: wallet?.balance ?? 0
    }
  });
}
