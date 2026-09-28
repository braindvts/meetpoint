import { redirect } from "next/navigation";
import { unlockAdmin } from "./actions";
import { canViewAdminFromRequest } from "@/lib/adminAccess";

export const dynamic = "force-dynamic";

export default async function AdminEnterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await canViewAdminFromRequest()) {
    redirect("/admin/analytics");
  }

  const params = await searchParams;
  const error =
    params.error === "config"
      ? "Admin access is not configured on this server."
      : params.error === "rate"
        ? "Too many attempts. Try again in a few minutes."
        : params.error
          ? "That secret does not match."
          : "";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-ink px-4 py-16 text-ivory">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Open analytics</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Use the same operator secret as reports and BLACK grants. ADMIN_EMAILS opens the
        dashboard only when this sign-in is Google or Apple and that provider's email
        is listed. A password signup does not, even after a company-email save.
      </p>
      <form action={unlockAdmin} className="mt-8">
        <label className="block text-[11px] uppercase tracking-[0.16em] text-muted">
          Admin secret
          <input
            type="password"
            name="secret"
            autoComplete="off"
            required
            className="mt-2 min-h-11 w-full border border-line bg-panel px-3 text-sm text-ivory outline-none focus:border-accent"
          />
        </label>
        {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
        <button
          type="submit"
          className="mt-4 min-h-11 w-full bg-ivory text-[11px] font-semibold uppercase tracking-[0.18em] text-ink"
        >
          Continue
        </button>
      </form>
    </main>
  );
}
