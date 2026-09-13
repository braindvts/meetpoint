export default function PageHeader({
  title,
  action,
  kicker = "Interlink",
  lede,
}: {
  title: string;
  action?: React.ReactNode;
  kicker?: string;
  lede?: string;
}) {
  return (
    <header className="mp-page-head">
      <div>
        <p className="mp-kicker hidden md:block">{kicker}</p>
        <h1>{title}</h1>
        {lede ? <p className="mt-1.5 max-w-md text-[13px] leading-snug text-muted">{lede}</p> : null}
      </div>
      {action ? <div className="mp-page-head-action">{action}</div> : null}
    </header>
  );
}
