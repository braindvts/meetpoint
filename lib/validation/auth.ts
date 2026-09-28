import { z } from "zod";
import { zEmail, zPassword, zShortText } from "./primitives";

export const emailAuthSchema = z
  .object({
    email: zEmail,
    password: zPassword,
    name: zShortText(80).optional(),
    mode: z.enum(["signin", "signup"]).optional(),
    /** Same-site path to return to. Ignored when it is not a relative path. */
    next: z.string().max(512).optional(),
    acceptTerms: z.boolean().optional(),
    acceptPrivacy: z.boolean().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.mode !== "signup") return;
    if (data.acceptTerms !== true) {
      ctx.addIssue({
        code: "custom",
        path: ["acceptTerms"],
        message: "Accept the Terms of Service to create an account.",
      });
    }
    if (data.acceptPrivacy !== true) {
      ctx.addIssue({
        code: "custom",
        path: ["acceptPrivacy"],
        message: "Acknowledge the Privacy Policy to create an account.",
      });
    }
  });

export const legalConsentSchema = z
  .object({
    acceptTerms: z.literal(true),
    acceptPrivacy: z.literal(true),
  })
  .strict();

export const deleteAccountSchema = z
  .object({
    confirm: z.literal("DELETE"),
  })
  .strict();

export const reauthSchema = z
  .object({
    password: zPassword,
  })
  .strict();

export type EmailAuthInput = z.infer<typeof emailAuthSchema>;
