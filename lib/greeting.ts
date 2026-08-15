/** Time-aware club greeting for The Room. */
export function eveningGreeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "Still awake";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Good evening";
}
