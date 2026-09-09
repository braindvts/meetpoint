import { z } from "zod";
import { citySchema, meetPrefEnum, travelEnum, zShortText } from "./primitives";

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
    url: z.string().max(400).optional().or(z.literal("")),
  })
  .strict();

/**
 * Client-writable profile fields only.
 * Rejects privileged keys (black, meetingsAttended, premier, verifications…).
 */
export const profileUpdateSchema = z
  .object({
    name: zShortText(80).min(1),
    jobTitle: zShortText(120),
    bio: zShortText(800),
    photo: z.string().max(2_000_000), // data URL or https
    city: citySchema,
    travel: travelEnum,
    meetPreference: meetPrefEnum.optional(),
    lookingFor: z.array(zShortText(60)).max(12),
    ideaTags: z.array(zShortText(60)).max(24),
    phone: zShortText(40).optional().or(z.literal("")),
    work: z.array(workSchema).max(20).optional(),
  })
  .strict();

export const membersMePutSchema = z
  .object({
    profile: profileUpdateSchema,
  })
  .strict();
