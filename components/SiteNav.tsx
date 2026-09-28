import Nav from "@/components/Nav";
import { adminNavLinkFor } from "@/lib/adminGate";
import { canViewAdminFromRequest } from "@/lib/adminAccess";

/**
 * Server-rendered nav. The Admin link is created only when the gate passes,
 * so non-admins do not receive it in HTML or in the client bundle.
 */
export default async function SiteNav() {
  const link = adminNavLinkFor(await canViewAdminFromRequest());
  return (
    <Nav
      adminSlot={
        link ? (
          <a href={link.href} role="listitem">
            {link.label}
          </a>
        ) : null
      }
    />
  );
}
