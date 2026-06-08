import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, paymentIntents, user, wallets } from "@/db/schema";
import { createId, fail, ok, readJson, requireRole } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { recordError, recordFraudFlag } from "@/lib/monitoring";
import { assertPaymentConfigured, createGatewayPayment, paymentChannels, PaymentConfigurationError, type PaymentChannel } from "@/lib/payments";
import { getAppSettings } from "@/lib/settings";

export const runtime = "nodejs";

type TopUpPaymentBody = {
  amount?: number;
  channel?: PaymentChannel;
  proofImage?: string;
  senderName?: string;
  reference?: string;
};

function isStoredImage(value?: string) {
  return Boolean(value?.startsWith("data:image/") || value?.startsWith("https://"));
}

async function ensureWallet(userId: string) {
  let wallet = await db.query.wallets.findFirst({ where: eq(wallets.userId, userId) });
  if (wallet) return wallet;

  const now = new Date();
  const id = createId("wal");
  await db.insert(wallets).values({
    id,
    userId,
    balance: 0,
    currency: "IDR",
    createdAt: now,
    updatedAt: now
  });
  wallet = await db.query.wallets.findFirst({ where: eq(wallets.id, id) });
  if (!wallet) throw new Error("Dompet gagal dibuat.");
  return wallet;
}

export async function POST(request: Request) {
  try {
    const { session, response } = await requireRole(["CUSTOMER", "PARTNER", "ADMIN"]);
    if (response || !session) return response;

    const body = await readJson<TopUpPaymentBody>(request);
    if (!body) return fail("Invalid JSON body.");

    const amount = Math.round(Number(body.amount ?? 0));
    const channel = body.channel ?? "QRIS";
    if (!paymentChannels.includes(channel)) return fail("Channel pembayaran tidak didukung.");
    if ((session.user.role === "CUSTOMER" || session.user.role === "PARTNER") && channel !== "BANK_TRANSFER" && channel !== "DANA") {
      return fail("Top up hanya bisa melalui rekening bank admin atau nomor DANA admin.", 422);
    }
    if ((session.user.role === "CUSTOMER" || session.user.role === "PARTNER") && !isStoredImage(body.proofImage)) {
      return fail("Wajib upload screenshot bukti transfer sebelum mengirim top up.", 422);
    }
    const minimumAmount = session.user.role === "PARTNER" ? 20_000 : 10_000;
    if (!Number.isFinite(amount) || amount < minimumAmount) return fail(`Minimal top up ${session.user.role === "PARTNER" ? "partner " : ""}Rp ${new Intl.NumberFormat("id-ID").format(minimumAmount)}.`);
    if (amount > 10_000_000) return fail("Maksimal top up Rp 10.000.000.");
    if (amount >= 5_000_000) {
      await recordFraudFlag({
        userId: session.user.id,
        entityType: "payment_intent",
        reason: "Top up manual bernominal besar perlu review ekstra.",
        riskScore: 65,
        metadata: { amount, channel, role: session.user.role }
      });
    }

    const wallet = await ensureWallet(session.user.id);
    const now = new Date();
    const intentId = createId("pay");
    await db.insert(paymentIntents).values({
      id: intentId,
      userId: session.user.id,
      walletId: wallet.id,
      provider: process.env.PAYMENT_PROVIDER || "xendit",
      channel,
      amount,
      status: "PENDING",
      createdAt: now,
      updatedAt: now
    });

    const useManualTopUp = session.user.role === "CUSTOMER" || session.user.role === "PARTNER" || channel === "BANK_TRANSFER";
    if (useManualTopUp) {
      const settings = await getAppSettings();
      const rawPayload = {
        mode: "manual_transfer",
        senderName: body.senderName?.trim() ?? "",
        reference: body.reference?.trim() ?? "",
        proofImage: isStoredImage(body.proofImage) ? body.proofImage : "",
        instructions: {
          bankName: settings.manualBankName,
          bankAccount: settings.manualBankAccount,
          bankHolder: settings.manualBankHolder,
          danaNumber: settings.manualDanaNumber,
          danaName: settings.manualDanaName,
          qrisName: settings.manualQrisName
        }
      };
      const destinationLabel = channel === "DANA" ? "nomor DANA admin" : "rekening bank admin";

      await db
        .update(paymentIntents)
        .set({
          provider: "manual",
          providerReference: intentId,
          rawPayload: JSON.stringify(rawPayload),
          updatedAt: new Date()
        })
        .where(eq(paymentIntents.id, intentId));
      await db.insert(notifications).values({
        id: createId("notif"),
        userId: session.user.id,
        kind: "SYSTEM",
        title: "Top Up menunggu verifikasi admin",
        body: `Transfer Rp ${new Intl.NumberFormat("id-ID").format(amount)} ke ${destinationLabel}, lalu tunggu admin menyetujui saldo.`,
        targetUrl: session.user.role === "PARTNER" ? "/partner?screen=wallet" : "/customer?screen=wallet",
        isRead: false,
        createdAt: now,
        updatedAt: now
      });

      const admins = await db.select().from(user).where(eq(user.role, "ADMIN"));
      if (admins.length) {
        await db.insert(notifications).values(
          admins.map((admin) => ({
            id: createId("notif"),
            userId: admin.id,
            kind: "SYSTEM" as const,
            title: session.user.role === "PARTNER" ? "Top Up partner menunggu cek admin" : "Top Up customer menunggu cek admin",
            body: `${session.user.name} membuat top up ${channel} Rp ${new Intl.NumberFormat("id-ID").format(amount)}. Cek uang masuk ke ${destinationLabel} sebelum menekan Setujui.`,
            targetUrl: "/admin",
            isRead: false,
            createdAt: now,
            updatedAt: now
          }))
        );
      }

      await writeAuditLog({
        session,
        action: "TOPUP_SUBMITTED",
        entityType: "payment_intent",
        entityId: intentId,
        metadata: { amount, channel, provider: "manual", role: session.user.role }
      });

      return ok({
        payment: {
          id: intentId,
          amount,
          channel,
          status: "PENDING",
          provider: "manual",
          instructions: rawPayload.instructions
        }
      });
    }

    try {
      assertPaymentConfigured();
    } catch (configurationError) {
      if (!(configurationError instanceof PaymentConfigurationError)) throw configurationError;

      const settings = await getAppSettings();
      const rawPayload = {
        mode: "manual_transfer",
        senderName: body.senderName?.trim() ?? "",
        reference: body.reference?.trim() ?? "",
        proofImage: isStoredImage(body.proofImage) ? body.proofImage : "",
        instructions: {
          bankName: settings.manualBankName,
          bankAccount: settings.manualBankAccount,
          bankHolder: settings.manualBankHolder,
          danaNumber: settings.manualDanaNumber,
          danaName: settings.manualDanaName,
          qrisName: settings.manualQrisName
        }
      };

      await db
        .update(paymentIntents)
        .set({
          provider: "manual",
          providerReference: intentId,
          rawPayload: JSON.stringify(rawPayload),
          updatedAt: new Date()
        })
        .where(eq(paymentIntents.id, intentId));
      await db.insert(notifications).values({
        id: createId("notif"),
        userId: session.user.id,
        kind: "SYSTEM",
        title: "Top Up menunggu verifikasi admin",
        body: `Transfer Rp ${new Intl.NumberFormat("id-ID").format(amount)} ke rekening/DANA/QRIS SERJAFAN, lalu tunggu admin menyetujui saldo.`,
        targetUrl: session.user.role === "PARTNER" ? "/partner?screen=wallet" : "/customer?screen=wallet",
        isRead: false,
        createdAt: now,
        updatedAt: now
      });

      const admins = await db.select().from(user).where(eq(user.role, "ADMIN"));
      if (admins.length) {
        await db.insert(notifications).values(
          admins.map((admin) => ({
            id: createId("notif"),
            userId: admin.id,
            kind: "SYSTEM" as const,
            title: session.user.role === "PARTNER" ? "Top Up partner menunggu cek admin" : "Top Up customer menunggu cek admin",
            body: `${session.user.name} membuat top up ${channel} Rp ${new Intl.NumberFormat("id-ID").format(amount)}. Cek uang masuk ke ${settings.manualBankName}/DANA/QRIS admin sebelum menekan Setujui.`,
            targetUrl: "/admin",
            isRead: false,
            createdAt: now,
            updatedAt: now
          }))
        );
      }

      await writeAuditLog({
        session,
        action: "TOPUP_SUBMITTED",
        entityType: "payment_intent",
        entityId: intentId,
        metadata: { amount, channel, provider: "manual-fallback", role: session.user.role }
      });

      return ok({
        payment: {
          id: intentId,
          amount,
          channel,
          status: "PENDING",
          provider: "manual",
          instructions: rawPayload.instructions
        }
      });
    }

    const gatewayPayment = await createGatewayPayment({
      intentId,
      amount,
      channel,
      customer: {
        name: session.user.name,
        email: session.user.email
      }
    });

    await db
      .update(paymentIntents)
      .set({
        provider: gatewayPayment.provider,
        providerReference: gatewayPayment.providerReference,
        checkoutUrl: gatewayPayment.checkoutUrl ?? null,
        qrString: gatewayPayment.qrString ?? null,
        rawPayload: JSON.stringify(gatewayPayment.rawPayload ?? {}),
        updatedAt: new Date()
      })
      .where(eq(paymentIntents.id, intentId));

    await writeAuditLog({
      session,
      action: "TOPUP_GATEWAY_CREATED",
      entityType: "payment_intent",
      entityId: intentId,
      metadata: { amount, channel, provider: gatewayPayment.provider }
    });

    return ok({
      payment: {
        id: intentId,
        amount,
        channel,
        status: "PENDING",
        checkoutUrl: gatewayPayment.checkoutUrl,
        qrString: gatewayPayment.qrString
      }
    });
  } catch (error) {
    console.error("Create topup payment failed", error);
    await recordError({ source: "payments.topup", error, severity: error instanceof PaymentConfigurationError ? "WARN" : "ERROR" });
    return fail(error instanceof Error ? error.message : "Top up payment gagal dibuat.", error instanceof PaymentConfigurationError ? 503 : 500);
  }
}
