"use client";

import { useId, useMemo, useRef, useState } from "react";
import { IDEA_TAG_LIMIT, partitionIdeaTags } from "@/lib/interests";
import { INTEREST_GROUPS } from "@/lib/onboardingDraft";
import { showToast } from "@/lib/notify";

interface Props {
  value: string[];
  error?: string;
  onChange: (tags: string[]) => void;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export default function InterestPicker({ value, error, onChange }: Props) {
  const searchId = useId();
  const errorId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = useMemo(() => new Set(value.map(normalize)), [value]);
  const atLimit = value.length >= IDEA_TAG_LIMIT;
  const q = query.trim().toLowerCase();

  const groups = useMemo(() => {
    return INTEREST_GROUPS.map((group) => ({
      ...group,
      tags: q ? group.tags.filter((tag) => tag.toLowerCase().includes(q)) : group.tags,
    })).filter((group) => group.tags.length > 0);
  }, [q]);

  const flat = useMemo(() => groups.flatMap((group) => [...group.tags]), [groups]);

  const customLabel = useMemo(() => {
    if (!query.trim()) return "";
    return partitionIdeaTags([query], 1).labels[0] || "";
  }, [query]);

  const customAlready =
    !!customLabel &&
    (selected.has(normalize(customLabel)) ||
      INTEREST_GROUPS.some((group) =>
        group.tags.some((tag) => normalize(tag) === normalize(customLabel))
      ));

  const showCustom = !!customLabel && !customAlready && (!q || flat.length === 0 || !flat.some((tag) => normalize(tag) === normalize(customLabel)));

  function toggle(tag: string) {
    const key = normalize(tag);
    if (selected.has(key)) {
      onChange(value.filter((item) => normalize(item) !== key));
      return;
    }
    if (atLimit) {
      showToast(`Up to ${IDEA_TAG_LIMIT} interests`);
      return;
    }
    const next = partitionIdeaTags([...value, tag]).labels;
    onChange(next);
  }

  function addCustom() {
    if (!customLabel || customAlready) return;
    if (customLabel.length > 80) {
      showToast("Keep that interest under 80 characters");
      return;
    }
    toggle(customLabel);
    setQuery("");
    setActive(0);
    searchRef.current?.focus();
  }

  function focusChip(index: number) {
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>("[data-interest]");
    buttons?.[index]?.focus();
  }

  function onSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(0);
      focusChip(0);
      return;
    }
    if (e.key === "Enter" && showCustom) {
      e.preventDefault();
      addCustom();
    }
  }

  function onChipKey(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = flat.length - 1;
    let next = index;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = Math.min(last, index + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = Math.max(0, index - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else if (e.key === "Escape") {
      searchRef.current?.focus();
      return;
    } else return;
    e.preventDefault();
    setActive(next);
    focusChip(next);
  }

  let cursor = 0;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <label htmlFor={searchId} className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          Interests
        </label>
        <p className="tabular-nums text-[12px] text-muted" aria-live="polite">
          {value.length}/{IDEA_TAG_LIMIT}
        </p>
      </div>

      <input
        ref={searchRef}
        id={searchId}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={onSearchKey}
        placeholder="Search or add your own"
        autoComplete="off"
        aria-describedby={error ? errorId : undefined}
        className="w-full rounded-lg border border-white/12 bg-transparent px-3 py-3 text-[15px] text-ivory outline-none placeholder:text-muted/50 focus:border-accent"
      />

      {showCustom ? (
        <button
          type="button"
          onClick={addCustom}
          className="mt-2 min-h-11 w-full rounded-lg border border-dashed border-accent/40 px-3 py-2 text-left text-[13px] text-ivory"
        >
          Add “{customLabel}”
        </button>
      ) : null}

      {value.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className="min-h-9 rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-[12px] text-accent-2"
              aria-label={`Remove ${tag}`}
            >
              {tag}
              <span aria-hidden> ×</span>
            </button>
          ))}
        </div>
      ) : null}

      <div ref={listRef} className="mt-5 space-y-5">
        {groups.length === 0 && !showCustom ? (
          <p className="text-sm text-muted">No interests match that search.</p>
        ) : null}
        {groups.map((group) => (
          <section key={group.id}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              {group.label}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {group.tags.map((tag) => {
                const index = cursor++;
                const on = selected.has(normalize(tag));
                const disabled = atLimit && !on;
                return (
                  <button
                    key={tag}
                    type="button"
                    data-interest=""
                    aria-pressed={on}
                    disabled={disabled}
                    tabIndex={index === active ? 0 : -1}
                    onFocus={() => setActive(index)}
                    onKeyDown={(e) => onChipKey(e, index)}
                    onClick={() => toggle(tag)}
                    className={`min-h-11 rounded-full border px-3.5 py-2 text-left text-[13px] disabled:opacity-40 ${
                      on
                        ? "border-accent/60 bg-accent/12 text-ivory"
                        : "border-white/12 text-muted hover:border-white/25 hover:text-ivory"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      {error ? (
        <p id={errorId} className="mt-3 text-[13px] text-accent-2" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
