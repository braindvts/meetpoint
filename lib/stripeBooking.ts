/** Pure check of a Stripe Checkout session used for a table booking. */
export function paidBookingMatches(
  session: {
    payment_status?: string | null;
    status?: string | null;
    metadata?: Record<string, string | null> | null;
  },
  memberId: string
): boolean {
  const paid = session.payment_status === "paid" || session.status === "complete";
  const meta = session.metadata || {};
  if (!paid) return false;
  if (meta.kind !== "booking") return false;
  if (!memberId || meta.memberId !== memberId) return false;
  if (!meta.chatId) return false;
  return true;
}

export function bookingChatId(
  session: { metadata?: Record<string, string | null> | null }
): string {
  return String(session.metadata?.chatId || "");
}
