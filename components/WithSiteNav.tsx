import SiteNav from "@/components/SiteNav";

/** Signed-in screens that already show the top nav. */
export default function WithSiteNav({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      {children}
    </>
  );
}
