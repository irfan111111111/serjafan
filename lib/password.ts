import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { verifyPassword as verifyBetterAuthPassword } from "@better-auth/utils/password";

const PREFIX = "serjafan-scrypt-v1";

export async function hashAppPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password.normalize("NFKC"), salt, 64).toString("hex");
  return `${PREFIX}:${salt}:${key}`;
}

export async function verifyAppPassword(hash: string, password: string) {
  if (hash.startsWith(`${PREFIX}:`)) {
    const [, salt, key] = hash.split(":");
    if (!salt || !key) return false;
    const expected = Buffer.from(key, "hex");
    const actual = scryptSync(password.normalize("NFKC"), salt, 64);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  try {
    return await verifyBetterAuthPassword(hash, password);
  } catch {
    return false;
  }
}
