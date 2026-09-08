"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import Avatar from "@/components/Avatar";
import BlackBadge from "@/components/BlackBadge";
import EmptyState from "@/components/EmptyState";
import PersonProfileSheet from "@/components/PersonProfileSheet";
import {
  acceptConnection,
  createChat,
  declineConnection,
  deleteChat,
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

export default function ChatsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile | null>(() => readClientProfile());
  const [chats, setChats] = useState<GroupChat[]>(() =>
    typeof window !== "undefined" ? loadChats() : []
  );
  const [connections, setConnections] = useState<Connection[]>(() =>
    readClientConnections()
  );
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [directory, setDirectory] = useState(() => loadDirectory());
  const [profilePerson, setProfilePerson] = useState<Person | null>(null);

  const refreshConnections = useCallback(() => setConnections(loadConnections()), []);

  const connectedPeers = useMemo(() => {
    const ids = connections.filter((c) => c.status === "connected").map((c) => c.peerId);
    return directory.filter((p) => ids.includes(p.id));
  }, [connections, directory]);

  const inbound = useMemo(
    () =>
      connections.filter((c) => c.status === "requested" && c.direction === "in"),
    [connections]
  );

  const outbound = useMemo(
    () =>
      connections.filter((c) => c.status === "requested" && c.direction !== "in"),
    [connections]
  );

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

  function accept(peerId: string) {
    setConnections(acceptConnection(peerId));
  }

  function decline(peerId: string) {
    setConnections(declineConnection(peerId));
  }

  function messagePeer(peerId: string, peerName: string) {
    const existing = loadChats().find(
      (c) => c.memberIds.length === 1 && c.memberIds[0] === peerId
    );
    if (existing) {
      router.push(`/chats/${existing.id}`);
      return;
    }
    const chat = createChat(peerName.split(" ")[0], [peerId]);
    router.push(`/chats/${chat.id}`);
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
      <main className="mp-app px-0 pb-10 md:px-6">
        <PageHeader
          title="Chats"
          action={
            <button
              onClick={() => setCreating((c) => !c)}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent"
              aria-label={creating ? "Cancel new chat" : "New chat"}
            >
              {creating ? (
                "Cancel"
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                  New chat
                </>
              )}
            </button>
          }
        />
        <div className="px-4 pt-2">
          <p className="text-[14px] text-ivory/70">
            Connect requests on the left · your threads on the right
          </p>
        </div>

        <div className="grid gap-6 px-4 pb-6 pt-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-8">
          {/* Left — people who want to connect */}
          <aside className="min-w-0">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
                Want to connect
              </h2>
              {(inbound.length > 0 || outbound.length > 0) && (
                <span className="text-[11px] text-muted">
                  {inbound.length ? `${inbound.length} for you` : ""}
                  {inbound.length && outbound.length ? " · " : ""}
                  {outbound.length ? `${outbound.length} sent` : ""}
                </span>
              )}
            </div>

            {inbound.length === 0 && outbound.length === 0 ? (
              <div className="border border-line/50 bg-ink/30 px-4 py-8 text-center">
                <p className="text-sm text-muted">No one waiting yet.</p>
                <Link
                  href="/discover"
                  className="mt-3 inline-block text-[12px] text-accent underline underline-offset-4"
                >
                  Discover people
                </Link>
              </div>
            ) : (
              <div className="mp-stagger space-y-2">
                {inbound.map((conn) => {
                  const person = findPerson(conn.peerId);
                  if (!person) return null;
                  return (
                    <div
                      key={conn.peerId}
                      className="mp-person-card border border-accent/20 bg-accent/[0.06] p-3"
                    >
                      <button
                        type="button"
                        onClick={() => setProfilePerson(person)}
                        className="flex w-full items-center gap-3 text-left"
                      >
                        <Avatar
                          src={person.photoUrl}
                          name={person.name}
                          sizeCls="h-11 w-11"
                          rounded="rounded-[12px]"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-base font-semibold text-ivory">
                            {person.name}
                          </p>
                          <p className="truncate text-[11px] text-muted">
                            {person.jobTitle}
                          </p>
                          <p className="mt-0.5 text-[11px] text-accent">Wants to connect</p>
                        </div>
                      </button>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            accept(person.id);
                            messagePeer(person.id, person.name);
                          }}
                          className="flex-1 rounded-md bg-gradient-to-b from-accent-2 to-accent px-3 py-2 text-[11px] font-medium text-ink"
                        >
                          Accept & chat
                        </button>
                        <button
                          type="button"
                          onClick={() => decline(person.id)}
                          className="border border-line px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })}

                {outbound.map((conn) => {
                  const person = findPerson(conn.peerId);
                  if (!person) return null;
                  return (
                    <div
                      key={conn.peerId}
                      className="mp-person-card flex items-center gap-3 border border-line/50 bg-ink/30 p-3"
                    >
                      <Avatar
                        src={person.photoUrl}
                        name={person.name}
                        sizeCls="h-10 w-10"
                        rounded="rounded-[12px]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ivory">{person.name}</p>
                        <p className="text-[11px] text-muted">Awaiting them</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </aside>

          {/* Right — people you chat with */}
          <section className="min-w-0">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
                Your chats
              </h2>
              {sorted.length > 0 && (
                <span className="text-[11px] text-muted">{sorted.length} thread{sorted.length === 1 ? "" : "s"}</span>
              )}
            </div>

            {creating && (
              <div className="mp-modal-in mp-person-card mb-4 p-4">
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
                    Accept a connect request on the left, or find someone in{" "}
                    <Link href="/discover" className="text-accent underline underline-offset-4">
                      Discover
                    </Link>
                    .
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
                            <Avatar
                              src={p.photoUrl}
                              name={p.name}
                              sizeCls="h-10 w-10"
                              rounded="rounded-[12px]"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-display text-lg font-semibold text-ivory">{p.name}</p>
                              <p className="truncate text-[10px] uppercase tracking-[0.16em] text-muted">
                                {p.jobTitle}
                              </p>
                            </div>
                            <span
                              className={`text-[10px] uppercase tracking-[0.2em] ${
                                on ? "text-accent" : "text-muted"
                              }`}
                            >
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
                title="No chats yet"
                body="Accept someone on the left, or start a private thread with a connection."
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
                            <h3 className="flex min-w-0 items-center gap-2 truncate font-display text-lg font-semibold text-ivory">
                              <span className="truncate">{chat.name}</span>
                              {members.some((m) => m.black) && <BlackBadge size="xs" />}
                            </h3>
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
          </section>
        </div>
      </main>

      <PersonProfileSheet
        open={!!profilePerson}
        person={profilePerson}
        onClose={() => setProfilePerson(null)}
        status={
          profilePerson
            ? connections.find((c) => c.peerId === profilePerson.id)?.status
            : undefined
        }
      />
    </>
  );
}
