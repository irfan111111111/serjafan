import assert from "node:assert/strict";
import test from "node:test";

const MIN_PARTNER_WORK_BALANCE = 20_000;
const PLATFORM_COMMISSION_RATE = 0.2;

function canPartnerReceiveCustomer(balance, verified = true, hasPaymentMethod = true) {
  return verified && hasPaymentMethod && balance >= MIN_PARTNER_WORK_BALANCE;
}

function calculateCommission(total) {
  return Math.ceil(total * PLATFORM_COMMISSION_RATE);
}

function approveTopup(balance, amount) {
  if (amount <= 0) throw new Error("Top up amount must be positive");
  return balance + amount;
}

function finishDirectTransferOrder(partnerDepositBalance, orderTotal) {
  const commission = calculateCommission(orderTotal);
  if (partnerDepositBalance < commission) {
    return { ok: false, reason: "INSUFFICIENT_COMMISSION_DEPOSIT", commission, nextBalance: partnerDepositBalance };
  }
  const nextBalance = partnerDepositBalance - commission;
  return {
    ok: true,
    commission,
    nextBalance,
    partnerStatus: nextBalance >= MIN_PARTNER_WORK_BALANCE ? "ONLINE" : "OFFLINE"
  };
}

test("partner cannot receive customers before minimum verified deposit", () => {
  assert.equal(canPartnerReceiveCustomer(0), false);
  assert.equal(canPartnerReceiveCustomer(19_999), false);
  assert.equal(canPartnerReceiveCustomer(20_000), true);
});

test("partner still cannot receive customers without verification or payment method", () => {
  assert.equal(canPartnerReceiveCustomer(25_000, false, true), false);
  assert.equal(canPartnerReceiveCustomer(25_000, true, false), false);
});

test("admin approve top up increases wallet balance", () => {
  assert.equal(approveTopup(10_000, 20_000), 30_000);
  assert.throws(() => approveTopup(10_000, 0), /positive/);
});

test("platform commission is exactly rounded-up 20 percent", () => {
  assert.equal(calculateCommission(50_000), 10_000);
  assert.equal(calculateCommission(50_001), 10_001);
});

test("direct transfer or cash order charges partner deposit and can force offline", () => {
  assert.deepEqual(finishDirectTransferOrder(20_000, 50_000), {
    ok: true,
    commission: 10_000,
    nextBalance: 10_000,
    partnerStatus: "OFFLINE"
  });
  assert.deepEqual(finishDirectTransferOrder(9_000, 50_000), {
    ok: false,
    reason: "INSUFFICIENT_COMMISSION_DEPOSIT",
    commission: 10_000,
    nextBalance: 9_000
  });
});

test("chat thread identity must stay scoped by order and partner", () => {
  const threadKey = (message) => `${message.orderId || "general"}:${message.partnerId || "admin"}:${message.serviceName || "support"}`;
  assert.notEqual(
    threadKey({ orderId: "ord_1", partnerId: "ptr_kunci", serviceName: "Duplikat Kunci" }),
    threadKey({ orderId: "ord_2", partnerId: "ptr_plat", serviceName: "Plat Nomor" })
  );
});

test("customer partner and admin sessions must use separated browser storage keys", () => {
  const sessionStorageKey = (role) => `serjafan-session-${role.toLowerCase()}`;
  assert.equal(sessionStorageKey("CUSTOMER"), "serjafan-session-customer");
  assert.equal(sessionStorageKey("PARTNER"), "serjafan-session-partner");
  assert.equal(sessionStorageKey("ADMIN"), "serjafan-session-admin");
  assert.notEqual(sessionStorageKey("CUSTOMER"), sessionStorageKey("PARTNER"));
  assert.notEqual(sessionStorageKey("PARTNER"), sessionStorageKey("ADMIN"));
});
