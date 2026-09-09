import { z } from "zod";
import { zId, zShortText } from "./primitives";

export const blackActivateSchema = z
  .object({
    source: z.enum(["paid", "earned"]).optional(),
    sessionId: zShortText(200).optional(),
  })
  .strict();

export const blackInvitePostSchema = z
  .object({
    peerId: zId,
    chatId: zShortText(80).optional(),
    kind: z.enum(["connection", "meeting"]).optional(),
  })
  .strict();

export const blackInvitePatchSchema = z
  .object({
    inviteId: zId,
    action: z.enum(["accept", "decline"]).optional(),
  })
  .strict();

export const blackMeetingSchema = z
  .object({
    peerId: zId,
  })
  .strict();

export const blackGrantSchema = z
  .object({
    memberId: zId,
    black: z.boolean().optional(),
  })
  .strict();

export const billingCheckoutSchema = z
  .object({
    kind: z
      .enum(["premier_month", "premier_year", "black_month", "black_year", "booking"])
      .optional(),
    amountUsd: z.number().min(1).max(500).optional(),
    label: zShortText(120).optional(),
    chatId: zShortText(80).optional(),
    meetupAt: zShortText(40).optional(),
    phone: zShortText(40).optional(),
  })
  .strict();
