import { z } from "zod";
import { IDEA_TAGS } from "@/lib/data";
import { LOOKING_FOR_OPTIONS } from "@/lib/types";
import { citySchema, lookingForEnum, meetPrefEnum, travelEnum, zShortText } from "./primitives";

const ideaTagSet = new Set<string>(IDEA_TAGS);

const httpsUrl = z
  .string()
  .trim()
  .max(400)
  .refine((value) => !value || /^https:\/\/\S+$/i.test(value), "Link must start with https://");

const workSchema = z
  .object({
    title: zShortText(120),
    kind: z.enum([
      "company",
      "app",
      "product",
      "website",
      "content",
      "portfolio",
      "project",
    ]),
    description: zShortText(400),
    url: httpsUrl.optional().or(z.literal("")),
  })
  .strict();

/** https URL (short) or a JPEG/PNG/WebP data URL. Empty is allowed before a photo is chosen. */
export const photoSchema = z
  .string()
  .max(1_200_000)
  .refine((value) => {
    if (!value) return true;
    if (value.startsWith("https://")) return value.length <= 2_000 && /^https:\/\/\S+$/i.test(value);
    return /^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=\r\n]+$/i.test(value);
  }, "Use an https image URL or a JPEG, PNG, or WebP upload.");

const phoneSchema = z
  .string()
  .trim()
  .max(40)
  .refine((value) => {
    if (!value) return true;
    const digits = value.replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15;
  }, "Enter a valid phone number.");

/**
 * Client-writable profile fields only.
 * Rejects privileged keys (black, meetingsAttended, premier, verifications…).
 */
export const profileUpdateSchema = z
  .object({
    name: zShortText(80).min(1),
    jobTitle: zShortText(120),
    bio: zShortText(800),
    photo: photoSchema,
    city: citySchema,
    travel: travelEnum,
    meetPreference: meetPrefEnum.optional(),
    lookingFor: z.array(lookingForEnum).max(LOOKING_FOR_OPTIONS.length),
    ideaTags: z
      .array(
        z
          .string()
          .trim()
          .max(60)
          .refine((tag) => ideaTagSet.has(tag), "Unknown interest")
      )
      .max(12),
    phone: phoneSchema.optional().or(z.literal("")),
    work: z.array(workSchema).max(12).optional(),
  })
  .strict();

export const membersMePutSchema = z
  .object({
    profile: profileUpdateSchema,
  })
  .strict();
