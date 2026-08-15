"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";
import {
  createChat,
  deleteChat,
  loadChats,
  loadConnections,
  loadProfile,
} from "@/lib/store";
import { findPerson, loadDirectory, refreshDirectory } from "@/lib/directory";
import { readClientProfile } from "@/lib/clientProfile";
import type { GroupChat, MyProfile } from "@/lib/types";

function relativeTime(iso?: string): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ChatsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile | null>(() => readClientProfile());
  const [chats, setChats] = useState<GroupChat[]>(() =>
    typeof window !== "undefined" ? loadChats() : []
  );
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const [directory, setDirectory] = useState(() => loadDirectory());

  const connectedPeers = useMemo(() => {
    const ids = loadConnections()
      .filter((c) => c.status === "connected")
      .map((c) => c.peerId);
    return directory.filter((p) => ids.includes(p.id));
  }, [chats, creating, profile, directory]);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace("/onboarding");
      return;
    }
    setProfile(p);
    setChats(loadChats());
    void refreshDirectory().then(setDirectory);

    const refresh = () => setChats(loadChats());
    const onDir = () => setDirectory(loadDirectory());
    window.addEventListener("meetpoint:chats-changed", refresh);
    window.addEventListener("meetpoint:directory-changed", onDir);
    return () => {
      window.removeEventListener("meetpoint:chats-changed", refresh);
      window.removeEventListener("meetpoint:directory-changed", onDir);
    };
  }, [router]);

  function toggleMember(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function startPrivate() {
    if (selected.length === 0) return;
    const chat = createChat(name || defaultName(selected), selected);
    setCreating(false);
    setName("");
    setSelected([]);
    router.push(`/chats/${chat.id}`);
  }

  function defaultName(ids: string[]) {
    const names = ids
      .map((id) => findPerson(id)?.name.split(" ")[0])
      .filter(Boolean) as string[];
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} & ${names[1]}`;
    return names[0] ? `${names[0]} + ${names.length - 1}` : "Private";
  }

  if (!profile) return null;

  const sorted = [...chats].sort((a, b) => {
    const ta = a.messages[a.messages.length - 1]?.createdAt || "";
    const tb = b.messages[b.messages.length - 1]?.createdAt || "";
    return tb.localeCompare(ta);
  });

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-3 py-4 pb-28 sm:px-6 sm:py-10">
        <section className="mp-reveal mp-room-banner mb-6 p-5 sm:mb-10 sm:p-8">
          <div className="relative z-[1] flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-accent">
                Members only
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                Private<span className="italic text-accent">.</span>
              </h1>
              <p className="mt-2 hidden text-sm text-muted sm:block">
                Quiet threads with people you&apos;ve been introduced to.
              </p>
            </div>
            <button
              onClick={() => setCreating((c) => !c)}
              className="mp-btn-lux bg-gradient-to-b from-accent-2 to-accent px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink"
            >
              {creating ? "Cancel" : "New thread"}
            </button>
          </div>
        </section>

        {creating && (
          <div className="mp-modal-in mb-8 border border-accent/20 bg-panel/80 p-5 sm:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-accent">
              Start a private chat
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (optional)"
              className="mt-4 w-full border-0 border-b border-line bg-transparent px-0 py-3 text-base text-ivory outline-none placeholder:text-muted/45 focus:border-accent"
            />
            {connectedPeers.length === 0 ? (
              <p className="mt-6 text-sm text-muted">
                Need an introduction in your{" "}
                <Link href="/connections" className="text-accent underline underline-offset-4">
                  circle
                </Link>{" "}
                first.
              </p>
            ) : (
              <>
                <div className="mp-stagger mt-6 space-y-2">
                  {connectedPeers.map((p) => {
                    const on = selected.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleMember(p.id)}
                        className={`mp-row flex w-full items-center gap-3 border px-4 py-3 text-left ${
                          on ? "border-accent/50 bg-accent/10" : "border-line/60 bg-ink/40"
                        }`}
                      >
                        <Avatar src={p.photoUrl} name={p.name} sizeCls="h-10 w-10" rounded="rounded-none" />
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-lg font-semibold text-ivory">{p.name}</p>
                          <p className="truncate text-[10px] uppercase tracking-[0.16em] text-muted">
                            {p.jobTitle}
                          </p>
                        </div>
                        <span className={`text-[10px] uppercase tracking-[0.2em] ${on ? "text-accent" : "text-muted"}`}>
                          {on ? "Invited" : "Add"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={startPrivate}
                  disabled={selected.length === 0}
                  className="mp-btn-lux mt-6 w-full bg-gradient-to-b from-accent-2 to-accent py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink disabled:opacity-40 sm:w-auto sm:px-10"
                >
                  Start private
                </button>
              </>
            )}
          </div>
        )}

        {sorted.length === 0 && !creating ? (
          <EmptyState
            title="No private chats yet"
            body="Connect in the room, then open a quiet thread here."
            actionHref="/discover"
            actionLabel="Enter the room"
          />
        ) : (
          <div className="mp-stagger divide-y divide-line/60 border border-line/70 bg-panel/40">
            {sorted.map((chat) => {
              const members = directory.filter((p) => chat.memberIds.includes(p.id));
              const last = [...chat.messages].reverse().find((m) => m.senderId !== "system");
              const when = relativeTime(last?.createdAt || chat.messages.at(-1)?.createdAt);
              const lead = members[0];
              return (
                <div key={chat.id} className="group flex items-stretch">
                  <Link
                    href={`/chats/${chat.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3.5 transition hover:bg-accent/[0.04] sm:gap-4 sm:px-5 sm:py-4"
                  >
                    <Avatar
                      src={lead?.photoUrl}
                      name={lead?.name || chat.name}
                      sizeCls="h-12 w-12 sm:h-14 sm:w-14"
                      rounded="rounded-none"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h2 className="truncate font-display text-lg font-semibold text-ivory sm:text-xl">
                          {chat.name}
                        </h2>
                        {when && (
                          <span className="shrink-0 text-[10px] uppercase tracking-wider text-accent/70">
                            {when}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.14em] text-muted">
                        {members.map((m) => m.name.split(" ")[0]).join(" · ") || "You"}
                      </p>
                      {last && (
                        <p className="mt-1 truncate text-[12px] text-muted/90 sm:text-sm">
                          {last.senderId === "me" ? "You: " : ""}
                          {last.attachment && !last.text
                            ? last.attachment.kind === "image"
                              ? "Photo"
                              : "Attachment"
                            : last.text}
                        </p>
                      )}
                    </div>
                  </Link>
                  <button
                    title="Close"
                    onClick={() => setChats(deleteChat(chat.id))}
                    className="border-l border-line/50 px-3 text-muted transition hover:bg-white/[0.03] hover:text-ivory sm:px-4"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
