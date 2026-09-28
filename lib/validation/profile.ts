import { z } from "zod";
import { isAllowedIdeaTag, normalizeIdeaTags } from "@/lib/ideaTags";
import { IDEA_TAG_LIMIT, canonicalIndustry } from "@/lib/interests";
import { isRandomUserPhotoHost } from "@/lib/sampleAccounts";
import { LOOKING_FOR_OPTIONS } from "@/lib/types";
import { citySchema, lookingForEnum, meetPrefEnum, travelEnum, zShortText } from "./primitives";

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
  }, "Use an https image URL or a JPEG, PNG, or WebP upload.")
  .refine(
    (value) => !value || !isRandomUserPhotoHost(value),
    "Choose a photo that is not hosted on randomuser.me."
  );

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
 * Custom interest tags use the same plain-text rules as the safety work
 * (short, no URLs, no markup). Up to 24. Only catalog tags are matched on.
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
          .refine(
            (tag) => isAllowedIdeaTag(tag),
            "Use a listed idea or a short custom tag without links or markup"
          )
      )
      .max(IDEA_TAG_LIMIT),
    company: zShortText(120).optional().or(z.literal("")),
    industry: zShortText(80).optional().or(z.literal("")),
    phone: phoneSchema.optional().or(z.literal("")),
    work: z.array(workSchema).max(12).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (canonicalIndustry(value.industry) === null) {
      ctx.addIssue({
        code: "custom",
        path: ["industry"],
        message: "Choose an industry from the list",
      });
    }
  })
  .transform((value) => {
    const industry = canonicalIndustry(value.industry) || "";
    return {
      ...value,
      company: (value.company || "").trim(),
      industry,
      ideaTags: normalizeIdeaTags(value.ideaTags, IDEA_TAG_LIMIT),
    };
  });

export const membersMePutSchema = z
  .object({
    profile: profileUpdateSchema,
  })
  .strict();
