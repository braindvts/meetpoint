import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/** One row per OAuth state nonce. A second insert is a replay. */
export function oauthNonceKey(nonce: string): string {
  return `oauth-nonce:${nonce}`;
}

/**
 * Record this nonce until it expires. False on replay, expiry, or a store error
 * (fail closed). The row lives in RateLimitBucket so this stays additive.
 */
export async function claimOAuthNonceStored(nonce: string, expSec: number): Promise<boolean> {
  if (!nonce || nonce.length > 80) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(expSec) || nowSec > expSec) return false;
  try {
    await prisma.rateLimitBucket.create({
      data: {
        key: oauthNonceKey(nonce),
        count: 1,
        resetAt: new Date(expSec * 1000),
      },
    });
    return true;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return false;
    }
    console.error("[oauth] nonce claim failed");
    return false;
  }
}
