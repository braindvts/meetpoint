/** Strip control characters and dangerous HTML-ish content from user text. */
export function sanitizeText(input: string, maxLen = 4000): string {
  return String(input || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLen);
}

export function sanitizeName(input: string, maxLen = 80): string {
  return sanitizeText(input, maxLen).replace(/\s+/g, " ");
}
