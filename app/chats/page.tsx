"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
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
      <main className="mp-app pb-24">
        <PageHeader
          title="Chats"
          action={
            <button
              onClick={() => setCreating((c) => !c)}
              className="text-[13px] font-medium text-accent"
            >
              {creating ? "Cancel" : "New"}
            </button>
          }
        />
        <div className="px-4 pt-2">
          <p className="font-display text-[1.05rem] text-ivory/85">Private messages</p>
        </div>

        <div className="px-4 pb-6 pt-4">
        {creating && (
          <div className="mp-modal-in mp-person-card mb-6 p-4">
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
                <Link href="/circle" className="text-accent underline underline-offset-4">
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
                        <Avatar src={p.photoUrl} name={p.name} sizeCls="h-10 w-10" rounded="rounded-[12px]" />
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
            actionLabel="Discover"
          />
        ) : (
          <div className="mp-stagger space-y-3">
            {sorted.map((chat) => {
              const members = directory.filter((p) => chat.memberIds.includes(p.id));
              const last = [...chat.messages].reverse().find((m) => m.senderId !== "system");
              const when = relativeTime(last?.createdAt || chat.messages.at(-1)?.createdAt);
              const lead = members[0];
              return (
                <div key={chat.id} className="mp-person-card group flex items-stretch">
                  <Link
                    href={`/chats/${chat.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3"
                  >
                    <Avatar
                      src={lead?.photoUrl}
                      name={lead?.name || chat.name}
                      sizeCls="h-12 w-12"
                      rounded="rounded-[12px]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h2 className="truncate font-display text-lg font-semibold text-ivory">
                          {chat.name}
                        </h2>
                        {when && (
                          <span className="shrink-0 text-[11px] text-muted">{when}</span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-muted">
                        {members.map((m) => m.name.split(" ")[0]).join(" · ") || "You"}
                      </p>
                      {last && (
                        <p className="mt-1 truncate text-[12px] text-muted/90">
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
                    className="px-3 text-muted"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </main>
    </>
  );
}
