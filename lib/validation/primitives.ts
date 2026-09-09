import { z } from "zod";

/** Shared primitives — length-capped, trimmed. */
export const zEmail = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .email();

export const zPassword = z.string().min(8).max(128);

export const zId = z.string().trim().min(1).max(80);

export const zShortText = (max = 200) => z.string().trim().max(max);

export const zLongText = (max = 4000) => z.string().trim().max(max);

export const lookingForEnum = z.enum([
  "Co-founder",
  "Investor",
  "Mentor",
  "Clients",
  "Hiring",
  "Partnership",
  "Networking",
]);

export const travelEnum = z.enum(["local", "country", "worldwide"]);
export const meetPrefEnum = z.enum([
  "same-business",
  "can-help",
  "same-profession",
  "open",
]);

export const citySchema = z
  .object({
    name: zShortText(80),
    country: zShortText(80),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  })
  .strict();
