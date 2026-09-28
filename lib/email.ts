import { appUrl } from "./session";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY?.trim();
}

/** Verified sender in Resend, e.g. "Interlink <hello@yourdomain.com>". */
function fromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || "Interlink <onboarding@resend.dev>";
}

interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Send one transactional email through Resend.
 * Without RESEND_API_KEY this logs and resolves false — sign-up must never fail
 * because mail isn't configured yet.
 */
export async function sendEmail({ to, subject, html, text }: Mail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.info("[conclave email skipped]");
    return false;
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: fromAddress(), to: [to], subject, html, text }),
    });
    if (!res.ok) {
      console.error("[conclave email failed]", res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[conclave email error]", err);
    return false;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    if (ch === "&") return "&amp;";
    if (ch === "<") return "&lt;";
    if (ch === ">") return "&gt;";
    if (ch === '"') return "&quot;";
    return "&#39;";
  });
}

function welcomeHtml(firstName: string, link: string): string {
  const safeName = escapeHtml(firstName);
  const safeLink = escapeHtml(link);
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#050505;font-family:'Helvetica Neue',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#0c0b0a;border:1px solid rgba(212,196,168,0.22);">
      <tr>
        <td style="padding:32px 28px 8px;text-align:center;">
          <p style="margin:0;color:#d4c4a8;font-size:13px;letter-spacing:0.28em;">INTERLINK</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px 0;">
          <h1 style="margin:0;color:#f3efe6;font-size:24px;font-weight:600;">Welcome, ${safeName}.</h1>
          <p style="margin:14px 0 0;color:#8f877a;font-size:15px;line-height:1.6;">
            You're in. Interlink introduces you to people matched by ambition and profession — and it ends at a real table.
          </p>
          <p style="margin:14px 0 0;color:#8f877a;font-size:15px;line-height:1.6;">
            Finish your profile so introductions stay intentional: your role, what you're building, and what you're looking for.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;text-align:center;">
          <a href="${safeLink}" style="display:inline-block;padding:14px 34px;background:#d4c4a8;color:#050505;font-size:13px;font-weight:700;letter-spacing:0.04em;text-decoration:none;border-radius:10px;">
            Finish your profile
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 30px;text-align:center;">
          <p style="margin:0;color:#57524a;font-size:11px;line-height:1.6;">
            You received this because an account was created with this address.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Comma-separated ADMIN_EMAILS. Recipients only — not an access gate. */
export function adminNotifyEmails(env: Record<string, string | undefined> = process.env): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of (env.ADMIN_EMAILS || "").split(/[,;\s]+/)) {
    const email = part.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * One note when a member crosses into auto-hide.
 * Without RESEND_API_KEY or ADMIN_EMAILS this no-ops. The report still saves.
 */
export async function sendAutoHideAlert(member: { id: string; name: string }): Promise<void> {
  try {
    const recipients = adminNotifyEmails();
    if (!recipients.length) return;
    const link = appUrl("/admin/reports");
    const name = (member.name || "Member").trim() || "Member";
    const safeName = escapeHtml(name);
    const subject = `Auto-hidden from Discover: ${name}`;
    const text = [
      `${name} (${member.id}) is hidden from Discover.`,
      "Open reports from enough distinct trusted reporters crossed the auto-hide line.",
      `Review the queue: ${link}`,
    ].join("\n");
    const html = `<p><strong>${safeName}</strong> (${escapeHtml(member.id)}) is hidden from Discover.</p><p>Open reports from enough distinct trusted reporters crossed the auto-hide line.</p><p><a href="${escapeHtml(link)}">Review the queue</a></p>`;
    await Promise.all(
      recipients.map((to) => sendEmail({ to, subject, html, text }))
    );
  } catch (err) {
    console.error("[conclave auto-hide alert]", err);
  }
}

/** Sent once, when a member account is first created. */
export async function sendWelcomeEmail(to: string, name?: string): Promise<boolean> {
  const firstName = (name || "").trim().split(" ")[0] || "there";
  const link = appUrl("/onboarding");
  return sendEmail({
    to,
    subject: "Welcome to Interlink",
    html: welcomeHtml(firstName, link),
    text: [
      `Welcome, ${firstName}.`,
      "",
      "You're in. Interlink introduces you to people matched by ambition and profession — and it ends at a real table.",
      "",
      `Finish your profile so introductions stay intentional: ${link}`,
    ].join("\n"),
  });
}
