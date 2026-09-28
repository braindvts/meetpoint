import { prisma } from "./db";

const PROVIDERS = new Set(["email", "google", "apple", "linkedin"]);

/**
 * Record that an account was created. The row stores a provider name and
 * member id only — never the email address.
 */
export async function recordSignup(memberId: string, provider: string): Promise<void> {
  const safe = PROVIDERS.has(provider) ? provider : "email";
  try {
    await prisma.analyticsEvent.create({
      data: {
        name: "signup",
        path: "",
        memberId,
        metaJson: JSON.stringify({ provider: safe }),
      },
    });
  } catch (err) {
    console.error("signup analytics failed", err instanceof Error ? err.name : "error");
  }
}
