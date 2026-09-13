/**
 * Email signup must not bind a password to any existing member — OAuth-only
 * rows included. Mailbox control is not proven at signup.
 */
export function emailSignupTaken(
  existing: { id: string } | null | undefined
): existing is { id: string } {
  return existing != null;
}
