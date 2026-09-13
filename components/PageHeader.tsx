export default function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mp-page-head">
      <div>
        <p className="mp-kicker hidden md:block">Interlink</p>
        <h1>{title}</h1>
      </div>
      {action ? <div className="mp-page-head-action">{action}</div> : null}
    </header>
  );
}
