/** Conclave table booking fee — charged to every member when someone books. */
export const BOOKING_FEE_PER_PERSON_USD = 5;

export function bookingHeadcount(memberIds: string[]): number {
  return 1 + memberIds.length; // you + peers
}

export function bookingTotalUsd(memberIds: string[]): number {
  return bookingHeadcount(memberIds) * BOOKING_FEE_PER_PERSON_USD;
}

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}
