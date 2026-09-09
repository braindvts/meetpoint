import { z } from "zod";
import { REPORT_CATEGORIES, REPORT_STATUSES } from "@/lib/reportLabels";
import { zId, zLongText, zShortText } from "./primitives";

export {
  REPORT_CATEGORIES,
  REPORT_STATUSES,
  REPORT_CATEGORY_LABEL,
  type ReportCategory,
  type ReportStatus,
} from "@/lib/reportLabels";

export const connectionPostSchema = z
  .object({
    peerId: zId,
  })
  .strict();

export const connectionPatchSchema = z
  .object({
    peerId: zId,
    action: z.enum(["accept", "decline", "remove"]),
  })
  .strict();

export const chatCreateSchema = z
  .object({
    name: zShortText(80).optional(),
    memberIds: z.array(zId).max(12).optional(),
  })
  .strict();

export const chatMessageSchema = z
  .object({
    text: zLongText(4000),
  })
  .strict();

export const blockSchema = z
  .object({
    peerId: zId,
    action: z.enum(["block", "unblock"]).optional(),
  })
  .strict();

export const reportSchema = z
  .object({
    peerId: zId,
    category: z.enum(REPORT_CATEGORIES).optional(),
    reason: zShortText(500).min(3),
    alsoBlock: z.boolean().optional(),
  })
  .strict();

export const reportAdminPatchSchema = z
  .object({
    reportId: zId,
    status: z.enum(REPORT_STATUSES),
    notes: zShortText(1000).optional(),
  })
  .strict();

export const verifySchema = z
  .object({
    method: z.enum([
      "company-email",
      "linkedin",
      "resume",
      "website",
      "registration",
      "portfolio",
    ]),
    value: zShortText(500).min(1),
  })
  .strict();

export const smsSchema = z
  .object({
    to: zShortText(40).min(5),
    body: zShortText(480).min(1),
  })
  .strict();

export const analyticsSchema = z
  .object({
    name: zShortText(80).min(1),
    path: zShortText(200).optional(),
    meta: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  })
  .strict();

export const placesQuerySchema = z
  .object({
    q: zShortText(80).optional(),
    city: zShortText(80).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
  })
  .strict();
