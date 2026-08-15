/** Normalize digits-only for storage comparison. */
export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Basic validation — at least 10 digits. */
export function isValidPhone(phone: string): boolean {
  const d = digitsOnly(phone);
  return d.length >= 10 && d.length <= 15;
}

/** Light display formatting for US-ish numbers; otherwise keep as entered. */
export function formatPhoneDisplay(phone: string): string {
  const d = digitsOnly(phone);
  if (d.length === 10) {
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  if (d.length === 11 && d.startsWith("1")) {
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  }
  return phone.trim();
}

/** Mask for confirmation copy: show last 4 digits. */
export function maskPhone(phone: string): string {
  const d = digitsOnly(phone);
  if (d.length < 4) return phone;
  return `•••• ${d.slice(-4)}`;
}
