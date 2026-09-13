export default function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-center bg-ink/80 px-4 backdrop-blur-xl md:justify-start md:px-0">
      <h1 className="font-display text-[1.25rem] font-semibold tracking-[-0.03em] text-ivory">
        {title}
      </h1>
      {action ? (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 md:right-0">{action}</div>
      ) : null}
    </header>
  );
}
