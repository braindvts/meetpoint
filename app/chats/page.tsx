"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";
import NameMarks from "@/components/NameMarks";
import ChatThreadPanel from "@/components/ChatThreadPanel";
import EmptyState from "@/components/EmptyState";
import {
  createChat,
  loadChats,
  loadConnections,
  loadProfile,
} from "@/lib/store";
import { findPerson, loadDirectory, refreshDirectory } from "@/lib/directory";
import { readClientConnections, readClientProfile } from "@/lib/clientProfile";
import type { Connection, GroupChat, MyProfile, Person } from "@/lib/types";

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

type PeopleRow =
  | {
      key: string;
      kind: "person";
      person: Person;
      chat: GroupChat | null;
      lastAt: string;
      preview: string;
    }
  | {
      key: string;
      kind: "group";
      chat: GroupChat;
      lastAt: string;
      preview: string;
      lead?: Person;
    };

function lastPreview(chat: GroupChat | null): { at: string; text: string } {
  if (!chat) return { at: "", text: "Start a conversation" };
  const last = [...chat.messages].reverse().find((m) => m.senderId !== "system");
  const at = last?.createdAt || chat.messages.at(-1)?.createdAt || chat.updatedAt || "";
  if (!last) return { at, text: "Connected" };
  const prefix = last.senderId === "me" ? "You: " : "";
  if (last.attachment && !last.text) {
    return {
      at,
      text: prefix + (last.attachment.kind === "image" ? "Photo" : "Attachment"),
    };
  }
  return { at, text: prefix + last.text };
}

function ChatsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("c");

  const [profile, setProfile] = useState<MyProfile | null>(() => readClientProfile());
  const [chats, setChats] = useState<GroupChat[]>(() =>
    typeof window !== "undefined" ? loadChats() : []
  );
  const [connections, setConnections] = useState<Connection[]>(() =>
    readClientConnections()
  );
  const [directory, setDirectory] = useState(() => loadDirectory());
  const [query, setQuery] = useState("");

  const refreshConnections = useCallback(() => setConnections(loadConnections()), []);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace("/onboarding");
      return;
    }
    setProfile(p);
    setChats(loadChats());
    refreshConnections();
    void refreshDirectory().then(setDirectory);

    const refreshChats = () => setChats(loadChats());
    const onDir = () => setDirectory(loadDirectory());
    window.addEventListener("meetpoint:chats-changed", refreshChats);
    window.addEventListener("meetpoint:connections-changed", refreshConnections);
    window.addEventListener("meetpoint:directory-changed", onDir);
    return () => {
      window.removeEventListener("meetpoint:chats-changed", refreshChats);
      window.removeEventListener("meetpoint:connections-changed", refreshConnections);
      window.removeEventListener("meetpoint:directory-changed", onDir);
    };
  }, [router, refreshConnections]);

  const rows = useMemo(() => {
    const connectedIds = new Set(
      connections.filter((c) => c.status === "connected").map((c) => c.peerId)
    );

    const personRows: PeopleRow[] = [];
    for (const peerId of connectedIds) {
      const person = directory.find((p) => p.id === peerId) || findPerson(peerId);
      if (!person) continue;
      const chat =
        chats.find((c) => c.memberIds.length === 1 && c.memberIds[0] === peerId) || null;
      const { at, text } = lastPreview(chat);
      personRows.push({
        key: `person-${peerId}`,
        kind: "person",
        person,
        chat,
        lastAt: at || chat?.createdAt || "",
        preview: text,
      });
    }

    const covered = new Set(
      personRows
        .map((r) => (r.kind === "person" && r.chat ? r.chat.id : null))
        .filter(Boolean) as string[]
    );

    const groupRows: PeopleRow[] = chats
      .filter((c) => c.memberIds.length !== 1 || !connectedIds.has(c.memberIds[0]))
      .filter((c) => !covered.has(c.id))
      .map((chat) => {
        const { at, text } = lastPreview(chat);
        const lead = directory.find((p) => chat.memberIds.includes(p.id));
        return {
          key: `group-${chat.id}`,
          kind: "group" as const,
          chat,
          lastAt: at || chat.createdAt,
          preview: text,
          lead,
        };
      });

    return [...personRows, ...groupRows].sort((a, b) =>
      (b.lastAt || "").localeCompare(a.lastAt || "")
    );
  }, [chats, connections, directory]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      if (row.kind === "person") {
        const hay = [
          row.person.name,
          row.person.jobTitle,
          row.person.city?.name,
          row.preview,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      }
      const memberNames = row.chat.memberIds
        .map((id) => findPerson(id)?.name || "")
        .join(" ");
      const hay = [row.chat.name, memberNames, row.lead?.name, row.preview]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  const selectChat = useCallback(
    (chatId: string) => {
      router.replace(`/chats?c=${encodeURIComponent(chatId)}`, { scroll: false });
    },
    [router]
  );

  const clearSelection = useCallback(() => {
    router.replace("/chats", { scroll: false });
  }, [router]);

  function openPerson(person: Person, existing: GroupChat | null) {
    if (existing) {
      selectChat(existing.id);
      return;
    }
    const chat = createChat(person.name.split(" ")[0], [person.id]);
    setChats(loadChats());
    selectChat(chat.id);
  }

  if (!profile) return null;

  const threadOpen = !!selectedId;

  return (
    <>
      <Nav />
      <main className="mp-chats-layout">
        <aside
          className={`mp-chats-rail border-r border-line/50 ${
            threadOpen ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="shrink-0 border-b border-line/50 px-4 py-4">
            <h1 className="font-display text-2xl font-semibold text-ivory">Chats</h1>
            <p className="mt-1 text-[13px] text-muted">
              People you’ve accepted · pick one to message
            </p>
            <label className="relative mt-3 block">
              <span className="sr-only">Search people</span>
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people…"
                autoComplete="off"
                className="w-full rounded-xl border border-line/70 bg-ink/50 py-2.5 pl-10 pr-3 text-sm text-ivory outline-none placeholder:text-muted/55 focus:border-accent"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {rows.length === 0 ? (
              <div className="px-2 py-8">
                <EmptyState
                  title="No conversations yet"
                  body="Accept someone in Circle, then message them here."
                  actionHref="/circle"
                  actionLabel="Open Circle"
                />
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <p className="text-sm text-muted">No people match “{query.trim()}”.</p>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-3 text-[12px] text-accent underline underline-offset-4"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="mp-stagger space-y-1">
                {filteredRows.map((row) => {
                  if (row.kind === "person") {
                    const active = row.chat?.id === selectedId;
                    return (
                      <button
                        key={row.key}
                        type="button"
                        onClick={() => openPerson(row.person, row.chat)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                          active
                            ? "bg-accent/15 ring-1 ring-accent/35"
                            : "hover:bg-white/[0.04]"
                        }`}
                      >
                        <Avatar
                          src={row.person.photoUrl}
                          name={row.person.name}
                          sizeCls="h-11 w-11"
                          rounded="rounded-[12px]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="flex min-w-0 items-center gap-1.5 truncate font-medium text-ivory">
                              <span className="truncate">{row.person.name}</span>
                              <NameMarks
                                black={!!row.person.black}
                                trusted={(row.person.blackConnections ?? 0) > 0}
                                trustedCount={row.person.blackConnections}
                                size="xs"
                              />
                            </p>
                            {row.lastAt && (
                              <span className="shrink-0 text-[11px] text-muted">
                                {relativeTime(row.lastAt)}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-[12px] text-muted">{row.preview}</p>
                        </div>
                      </button>
                    );
                  }

                  const active = row.chat.id === selectedId;
                  return (
                    <button
                      key={row.key}
                      type="button"
                      onClick={() => selectChat(row.chat.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                        active
                          ? "bg-accent/15 ring-1 ring-accent/35"
                          : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <Avatar
                        src={row.lead?.photoUrl}
                        name={row.lead?.name || row.chat.name}
                        sizeCls="h-11 w-11"
                        rounded="rounded-[12px]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate font-medium text-ivory">{row.chat.name}</p>
                          {row.lastAt && (
                            <span className="shrink-0 text-[11px] text-muted">
                              {relativeTime(row.lastAt)}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[12px] text-muted">{row.preview}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-line/40 px-4 py-3 text-[12px] text-muted">
            Incoming connects live in{" "}
            <Link href="/circle" className="text-accent underline underline-offset-4">
              Circle
            </Link>
            .
          </div>
        </aside>

        <section
          className={`mp-chats-thread min-w-0 ${
            threadOpen ? "flex" : "hidden lg:flex"
          }`}
        >
          {selectedId ? (
            <ChatThreadPanel
              key={selectedId}
              chatId={selectedId}
              embedded
              onBack={clearSelection}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center px-8 text-center">
              <p className="font-display text-2xl font-semibold text-ivory">Select a chat</p>
              <p className="mt-2 max-w-sm text-sm text-muted">
                Pick someone on the left to open the thread here.
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default function ChatsPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh" />}>
      <ChatsInner />
    </Suspense>
  );
}
