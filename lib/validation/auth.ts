import { z } from "zod";
import { zEmail, zPassword, zShortText } from "./primitives";

export const emailAuthSchema = z
  .object({
    email: zEmail,
    password: zPassword,
    name: zShortText(80).optional(),
    mode: z.enum(["signin", "signup"]).optional(),
  })
  .strict();

export const reauthSchema = z
  .object({
    password: zPassword,
  })
  .strict();

export type EmailAuthInput = z.infer<typeof emailAuthSchema>;
