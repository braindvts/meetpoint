"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";
import NameMarks from "@/components/NameMarks";
import ChatThreadPanel from "@/components/ChatThreadPanel";
import EmptyState from "@/components/EmptyState";
import NewChatSheet from "@/components/NewChatSheet";
import InterlinksSheet from "@/components/InterlinksSheet";
import {
  loadChats,
  loadConnections,
  loadProfile,
  openOrCreateDirectChat,
} from "@/lib/store";
import {
  ensureReadBaseline,
  markChatRead,
  unreadCountForChat,
} from "@/lib/chatUnread";
import NotifyPrompt from "@/components/NotifyPrompt";
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

type ChatRow = {
  key: string;
  chat: GroupChat;
  title: string;
  person?: Person;
  lastAt: string;
  preview: string;
  isGroup: boolean;
};

function lastPreview(chat: GroupChat): { at: string; text: string } {
  const last = [...chat.messages].reverse().find((m) => m.senderId !== "system");
  const at = last?.createdAt || chat.messages.at(-1)?.createdAt || chat.updatedAt || "";
  if (!last) return { at, text: chat.memberIds.length > 1 ? "Group created" : "Chat opened" };
  const prefix = last.senderId === "me" ? "You: " : "";
  if (last.attachment && !last.text) {
    return {
      at,
      text: prefix + (last.attachment.kind === "image" ? "Photo" : "Attachment"),
    };
  }
  return { at, text: prefix + last.text };
}

/** Compact icon — opens group composer with people you’re connected to. */
function GroupChatIconButton({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="New group chat"
      title="New group chat"
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-accent/35 text-accent transition hover:border-accent/70 hover:bg-accent/10 active:scale-95 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
        <circle cx="9" cy="9" r="2.6" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="16.2" cy="10.2" r="2.2" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M4.5 17.2c.7-2 2.3-3.1 4.5-3.1s3.8 1.1 4.5 3.1"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M13.2 16.8c.5-1.4 1.7-2.2 3.2-2.2 1.2 0 2.2.5 2.8 1.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M19.2 5.2v3.2M17.6 6.8h3.2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
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
  const [composerOpen, setComposerOpen] = useState(false);
  const [interlinksOpen, setInterlinksOpen] = useState(false);
  const [unreadTick, setUnreadTick] = useState(0);

  const refreshConnections = useCallback(() => setConnections(loadConnections()), []);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace("/onboarding");
      return;
    }
    setProfile(p);
    const loaded = loadChats();
    ensureReadBaseline(loaded);
    setChats(loaded);
    refreshConnections();
    void refreshDirectory().then(setDirectory);

    const refreshChats = () => setChats(loadChats());
    const onUnread = () => setUnreadTick((n) => n + 1);
    const onDir = () => setDirectory(loadDirectory());
    window.addEventListener("meetpoint:chats-changed", refreshChats);
    window.addEventListener("meetpoint:unread-changed", onUnread);
    window.addEventListener("meetpoint:connections-changed", refreshConnections);
    window.addEventListener("meetpoint:directory-changed", onDir);
    return () => {
      window.removeEventListener("meetpoint:chats-changed", refreshChats);
      window.removeEventListener("meetpoint:unread-changed", onUnread);
      window.removeEventListener("meetpoint:connections-changed", refreshConnections);
      window.removeEventListener("meetpoint:directory-changed", onDir);
    };
  }, [router, refreshConnections]);

  const connectedPeople = useMemo(() => {
    return connections
      .filter((c) => c.status === "connected")
      .map((c) => directory.find((p) => p.id === c.peerId) || findPerson(c.peerId))
      .filter((p): p is Person => !!p);
  }, [connections, directory]);

  /** Only threads the user has opened — never every connection. */
  const rows = useMemo(() => {
    void unreadTick;
    const list: ChatRow[] = chats.map((chat) => {
      const isGroup = chat.memberIds.length > 1;
      const person = !isGroup
        ? directory.find((p) => p.id === chat.memberIds[0]) ||
          findPerson(chat.memberIds[0])
        : undefined;
      const { at, text } = lastPreview(chat);
      const title = isGroup
        ? chat.name
        : person?.name || chat.name || "Chat";
      return {
        key: chat.id,
        chat,
        title,
        person,
        lastAt: at || chat.createdAt,
        preview: text,
        isGroup,
      };
    });
    return list.sort((a, b) => (b.lastAt || "").localeCompare(a.lastAt || ""));
  }, [chats, directory, unreadTick]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const memberNames = row.chat.memberIds
        .map((id) => findPerson(id)?.name || "")
        .join(" ");
      const hay = [row.title, row.person?.jobTitle, memberNames, row.preview]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  const selectChat = useCallback(
    (chatId: string) => {
      const chat = loadChats().find((c) => c.id === chatId);
      if (chat) markChatRead(chat);
      router.replace(`/chats?c=${encodeURIComponent(chatId)}`, { scroll: false });
    },
    [router]
  );

  const clearSelection = useCallback(() => {
    router.replace("/chats", { scroll: false });
  }, [router]);

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
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-semibold text-ivory">Chats</h1>
                <p className="mt-1 text-[13px] text-muted">
                  Threads you open · groups you start
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInterlinksOpen(true)}
                  aria-label={`Interlinks, ${connectedPeople.length} connections`}
                  title="Interlinks"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full border border-accent/30 px-2.5 text-accent transition hover:border-accent/55 hover:bg-accent/10"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                    <circle cx="8.5" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.7" />
                    <circle cx="15.5" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.7" />
                    <path
                      d="M4.2 17c.6-1.9 2-3 4.3-3s3.7 1.1 4.3 3M11.5 17c.5-1.5 1.6-2.4 3.2-2.4 1.5 0 2.6.8 3.1 2.1"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-[11px] font-semibold tabular-nums">
                    {connectedPeople.length}
                  </span>
                </button>
                <GroupChatIconButton onClick={() => setComposerOpen(true)} />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              <button
                type="button"
                onClick={() => setInterlinksOpen(true)}
                className="text-accent hover:underline"
              >
                Interlinks
              </button>
              <span className="text-line"> · </span>
              {connectedPeople.length} connection
              {connectedPeople.length === 1 ? "" : "s"}
            </p>
            <label className="relative mt-2 block">
              <span className="sr-only">Search chats</span>
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
                placeholder="Search chats…"
                autoComplete="off"
                className="w-full rounded-xl border border-line/70 bg-ink/50 py-2.5 pl-10 pr-3 text-sm text-ivory outline-none placeholder:text-muted/55 focus:border-accent"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {rows.length === 0 ? (
              <div className="px-2 py-8">
                <EmptyState
                  title="No chats yet"
                  body="Open Interlinks to message someone you’re connected to, or use the group icon to start a group."
                />
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <p className="text-sm text-muted">No chats match “{query.trim()}”.</p>
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
                  const active = row.chat.id === selectedId;
                  const unread = unreadCountForChat(row.chat);
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
                      <div className="relative shrink-0">
                        <Avatar
                          src={
                            row.isGroup
                              ? row.chat.photo || row.person?.photoUrl
                              : row.person?.photoUrl
                          }
                          name={row.person?.name || row.title}
                          sizeCls="h-11 w-11"
                          rounded="rounded-[12px]"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p
                            className={`flex min-w-0 items-center gap-1.5 truncate font-medium ${
                              unread > 0 ? "text-ivory" : "text-ivory"
                            }`}
                          >
                            <span className={`truncate ${unread > 0 ? "font-semibold" : ""}`}>
                              {row.title}
                            </span>
                            {row.isGroup ? (
                              <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.12em] text-accent/80">
                                Group
                              </span>
                            ) : row.person ? (
                              <NameMarks
                                black={!!row.person.black}
                                trusted={(row.person.blackConnections ?? 0) > 0}
                                trustedCount={row.person.blackConnections}
                                size="xs"
                              />
                            ) : null}
                          </p>
                          {row.lastAt && (
                            <span className="shrink-0 text-[11px] text-muted">
                              {relativeTime(row.lastAt)}
                            </span>
                          )}
                        </div>
                        <p
                          className={`mt-0.5 truncate text-[12px] ${
                            unread > 0 ? "font-medium text-ivory/85" : "text-muted"
                          }`}
                        >
                          {row.preview}
                        </p>
                      </div>
                      {unread > 0 ? (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      ) : null}
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
            . Chats only appear after you start them.
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
                Pick a thread on the left, open Interlinks to message a connection, or tap the
                group icon for a new group.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setInterlinksOpen(true)}
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-accent/35 px-4 text-[12px] font-medium text-accent"
                >
                  Interlinks · {connectedPeople.length}
                </button>
                <GroupChatIconButton
                  onClick={() => setComposerOpen(true)}
                  className="h-12 w-12"
                />
              </div>
            </div>
          )}
        </section>
      </main>

      <NewChatSheet
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        people={connectedPeople}
        onCreated={(id) => {
          setChats(loadChats());
          selectChat(id);
        }}
      />
      <InterlinksSheet
        open={interlinksOpen}
        onClose={() => setInterlinksOpen(false)}
        people={connectedPeople}
        onMessage={(person) => {
          const chat = openOrCreateDirectChat(person.id, person.name);
          setInterlinksOpen(false);
          setChats(loadChats());
          selectChat(chat.id);
        }}
      />
      <NotifyPrompt />
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
