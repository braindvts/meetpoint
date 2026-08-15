"use client";

interface Props {
  src?: string;
  name: string;
  /** Tailwind size classes, e.g. "h-12 w-12" */
  sizeCls?: string;
  rounded?: string;
}

export default function Avatar({
  src,
  name,
  sizeCls = "h-12 w-12",
  rounded = "rounded-full",
}: Props) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`${sizeCls} ${rounded} shrink-0 border border-accent/25 object-cover`}
      />
    );
  }
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={`${sizeCls} ${rounded} font-display grid shrink-0 place-items-center border border-accent/25 bg-panel-2 text-sm font-semibold text-ivory`}
    >
      {initials || "?"}
    </span>
  );
}
