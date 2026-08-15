"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";
import FoodSuggestPopup from "@/components/FoodSuggestPopup";
import TableProposalCard, { takePendingBooking } from "@/components/TableProposalCard";
import {
  shouldSuggestMeetingSpots,
  suggestSpotsForChatLive,
  type FoodSuggestion,
} from "@/lib/foodAi";
import {
  agreeToTable,
  bookTable,
  clearTableProposal,
  getChat,
  loadProfile,
  proposeTable,
  sendChatMessage,
} from "@/lib/store";
import { findPerson, loadDirectory, refreshDirectory } from "@/lib/directory";
import type { ChatAttachment, GroupChat, MyProfile } from "@/lib/types";

function ChatThreadInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [chat, setChat] = useState<GroupChat | null>(null);
  const [text, setText] = useState("");
  const [foodHint, setFoodHint] = useState(false);
  const [foodExpanded, setFoodExpanded] = useState(false);
  const [foodSuggestions, setFoodSuggestions] = useState<FoodSuggestion[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingRef = useRef(false);
  const lastScannedRef = useRef<string>("");
  const lastUpdatedRef = useRef<string>("");
  /** Ignore the sync chats-changed event from our own write (was causing send bounce). */
  const ignoreChatsEventRef = useRef(false);

  // Lock the document so Safari can't create a black scroll gap
  useEffect(() => {
    document.documentElement.classList.add("mp-chat-lock");
    window.scrollTo(0, 0);
    return () => {
      document.documentElement.classList.remove("mp-chat-lock");
    };
  }, []);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace("/onboarding");
      return;
    }
    setProfile(p);
    const c = getChat(id);
    if (!c) {
      router.replace("/chats");
      return;
    }
    setChat(c);
    lastScannedRef.current = c.messages[c.messages.length - 1]?.id || "";
    lastUpdatedRef.current = c.updatedAt;
    void refreshDirectory();

    // Return from Stripe Checkout → finish booking
    if (searchParams.get("paid") === "1") {
      const pending = takePendingBooking(id);
      if (pending && !c.tableProposal?.booked) {
        ignoreChatsEventRef.current = true;
        const updated = bookTable(id, pending.meetupAt, pending.phone, "card");
        if (updated) {
          lastUpdatedRef.current = updated.updatedAt;
          setChat({ ...updated, messages: [...updated.messages] });
        }
        void import("@/lib/notify").then((n) => n.ensureNotifyPermission());
      }
      router.replace(`/chats/${id}`);
    }

    const refresh = () => {
      const next = getChat(id);
      if (!next) return;
      if (ignoreChatsEventRef.current) {
        ignoreChatsEventRef.current = false;
        lastUpdatedRef.current = next.updatedAt;
        return;
      }
      if (next.updatedAt === lastUpdatedRef.current) return;
      lastUpdatedRef.current = next.updatedAt;
      setChat({ ...next, messages: [...next.messages] });

      const last = next.messages[next.messages.length - 1];
      if (!last || last.id === lastScannedRef.current || last.senderId === "system") return;
      lastScannedRef.current = last.id;
      if (
        shouldSuggestMeetingSpots(last.text) &&
        p &&
        !(next.tableProposal && !next.tableProposal.booked)
      ) {
        const peers = loadDirectory().filter((x) => next.memberIds.includes(x.id));
        void suggestSpotsForChatLive(p.city, peers).then(({ suggestions }) => {
          if (suggestions.length > 0) {
            setFoodSuggestions(suggestions);
            setFoodHint(true);
            setFoodExpanded(false);
          }
        });
      }
    };
    window.addEventListener("meetpoint:chats-changed", refresh);

    // Cross-device chat sync (poll) when server chats exist
    const poll = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/chats/${id}/messages`);
        const data = (await res.json()) as {
          ok?: boolean;
          messages?: { id: string; senderId: string; text: string; createdAt: string }[];
        };
        if (!data.ok || !data.messages?.length) return;
        setChat((prev) => {
          if (!prev) return prev;
          const known = new Set(prev.messages.map((m) => m.id));
          const incoming = data.messages!.filter((m) => !known.has(m.id));
          if (!incoming.length) return prev;
          return {
            ...prev,
            messages: [...prev.messages, ...incoming],
            updatedAt: new Date().toISOString(),
          };
        });
      } catch {
        /* local-only chat still works */
      }
    }, 4000);

    return () => {
      window.removeEventListener("meetpoint:chats-changed", refresh);
      window.clearInterval(poll);
    };
  }, [id, router, searchParams]);

  function maybeSuggestFood(message: string, memberIds: string[]) {
    if (!profile || !shouldSuggestMeetingSpots(message)) return;
    // Only block while an open (unbooked) proposal is already in the thread
    if (chat?.tableProposal && !chat.tableProposal.booked) return;
    const peers = loadDirectory().filter((p) => memberIds.includes(p.id));
    void suggestSpotsForChatLive(profile.city, peers).then(({ suggestions }) => {
      if (suggestions.length === 0) return;
      setFoodSuggestions(suggestions);
      setFoodHint(true);
      setFoodExpanded(false);
    });
  }

  function applyChat(updated: GroupChat | undefined) {
    if (!updated) return;
    lastUpdatedRef.current = updated.updatedAt;
    setChat({ ...updated, messages: [...updated.messages] });
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !chat) return;
    const outgoing = text.trim();
    typingRef.current = true;
    ignoreChatsEventRef.current = true;
    const updated = sendChatMessage(chat.id, outgoing);
    setText("");
    applyChat(updated);
    if (updated) {
      const last = updated.messages[updated.messages.length - 1];
      if (last) lastScannedRef.current = last.id;
      maybeSuggestFood(outgoing, chat.memberIds);
    }
  }

  function sendAttachment(file: File) {
    if (!chat) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      if (!url) return;
      const attachment: ChatAttachment = {
        kind: file.type.startsWith("image/") ? "image" : "file",
        url,
        name: file.name,
        mime: file.type || undefined,
      };
      ignoreChatsEventRef.current = true;
      const updated = sendChatMessage(chat.id, "", attachment);
      applyChat(updated);
      if (updated) {
        const last = updated.messages[updated.messages.length - 1];
        if (last) lastScannedRef.current = last.id;
      }
    };
    reader.readAsDataURL(file);
  }

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    Array.from(files).forEach((f) => sendAttachment(f));
    e.target.value = "";
  }

  function runChatWrite(write: () => GroupChat | undefined) {
    ignoreChatsEventRef.current = true;
    applyChat(write());
  }

  if (!profile || !chat) return null;

  const members = loadDirectory().filter((p) => chat.memberIds.includes(p.id));

  function senderName(senderId: string) {
    if (senderId === "me") return profile!.name.split(" ")[0];
    if (senderId === "system") return "Conclave";
    return findPerson(senderId)?.name.split(" ")[0] || "Member";
  }

  function senderPhoto(senderId: string) {
    if (senderId === "me") return profile!.photo;
    return findPerson(senderId)?.photoUrl;
  }

  return (
    <>
      <Nav />
      <div className="mp-chat-shell">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col px-3 sm:px-6">
          <header className="shrink-0 border-b border-line/60 pb-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] sm:py-4 sm:pt-4">
            <div className="flex items-center gap-3">
              <Link
                href="/chats"
                className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted transition hover:text-accent-2"
              >
                ← Back
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="truncate font-display text-xl font-semibold tracking-tight sm:text-3xl">
                  {chat.name}
                </h1>
                <p className="truncate text-[9px] font-semibold uppercase tracking-[0.16em] text-muted sm:text-[10px] sm:tracking-[0.2em]">
                  You · {members.map((m) => m.name.split(" ")[0]).join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 -space-x-2">
                <Avatar src={profile.photo} name={profile.name} sizeCls="h-8 w-8" />
                {members.slice(0, 3).map((m) => (
                  <Avatar key={m.id} src={m.photoUrl} name={m.name} sizeCls="h-8 w-8" />
                ))}
              </div>
            </div>
          </header>

          <div className="mp-chat-messages px-0 py-3 sm:py-4">
            {/* Inner stack stays chronological; parent is column-reverse so bottom stays put */}
            <div className="flex flex-col space-y-3 sm:space-y-4">
              {chat.messages.map((m) => {
                const mine = m.senderId === "me";
                const system = m.senderId === "system";
                if (system) {
                  return (
                    <div key={m.id} className="mp-msg-in flex justify-center">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted/70">
                        {m.text}
                      </p>
                    </div>
                  );
                }
                const showCaption =
                  !!m.text.trim() &&
                  (!m.attachment || (m.text !== "Photo" && m.text !== m.attachment.name));
                return (
                  <div
                    key={m.id}
                    className={`mp-msg-in flex gap-2.5 sm:gap-3 ${mine ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar
                      src={senderPhoto(m.senderId)}
                      name={senderName(m.senderId)}
                      sizeCls="h-8 w-8 sm:h-9 sm:w-9"
                    />
                    <div className={`max-w-[78%] ${mine ? "text-right" : ""}`}>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                        {senderName(m.senderId)}
                      </p>
                      <div
                        className={`inline-block max-w-full border px-3.5 py-2.5 text-left text-sm leading-relaxed sm:px-4 sm:py-3 ${
                          mine
                            ? "border-accent/40 bg-accent/10 text-ivory"
                            : "border-line/70 bg-panel text-ivory/90"
                        }`}
                      >
                        {m.attachment?.kind === "image" && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.attachment.url}
                            alt={m.attachment.name}
                            className={`${showCaption ? "mb-2" : ""} max-h-56 w-full max-w-[240px] rounded-sm object-cover`}
                          />
                        )}
                        {m.attachment?.kind === "file" && (
                          <a
                            href={m.attachment.url}
                            download={m.attachment.name}
                            className={`${showCaption ? "mb-2" : ""} flex items-center gap-2 border border-line/50 bg-ink/40 px-2.5 py-2 text-left text-[12px] text-accent-2 transition hover:border-accent/40`}
                          >
                            <span className="text-base leading-none" aria-hidden>
                              ↗
                            </span>
                            <span className="min-w-0 truncate font-medium">{m.attachment.name}</span>
                          </a>
                        )}
                        {showCaption && m.text}
                      </div>
                    </div>
                  </div>
                );
              })}

              {chat.tableProposal && (
                <div className="pt-1">
                  {!chat.tableProposal.booked && (
                    <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-accent-2">
                      Table booking
                    </p>
                  )}
                  <TableProposalCard
                    chat={chat}
                    myName={profile.name}
                    profilePhone={profile.phone}
                    onAgree={() => runChatWrite(() => agreeToTable(chat.id))}
                    onBook={(meetupAt, phone, paymentMethod) => {
                      void import("@/lib/notify").then((n) => n.ensureNotifyPermission());
                      runChatWrite(() => bookTable(chat.id, meetupAt, phone, paymentMethod));
                    }}
                    onClear={
                      chat.tableProposal.booked
                        ? undefined
                        : () => runChatWrite(() => clearTableProposal(chat.id))
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <form onSubmit={send} className="mp-chat-composer sm:border-line/60 sm:py-4">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp"
              multiple
              className="hidden"
              onChange={onPickFiles}
            />
            <div className="flex items-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Attach photo or file"
                className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center border border-line/70 text-muted transition hover:border-accent/50 hover:text-accent-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M21.44 11.05l-8.49 8.49a5.25 5.25 0 01-7.42-7.42l8.49-8.49a3.5 3.5 0 014.95 4.95l-8.14 8.14a1.75 1.75 0 01-2.47-2.47l7.42-7.43"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={() => {
                  typingRef.current = true;
                }}
                onBlur={() => {
                  typingRef.current = false;
                }}
                enterKeyHint="send"
                autoComplete="off"
                placeholder="Write privately…"
                className="min-w-0 flex-1 border-0 border-b border-line bg-transparent px-0 py-2.5 text-base text-ivory outline-none placeholder:text-muted/45 focus:border-accent sm:py-3"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="rounded-full bg-gradient-to-b from-accent-2 to-accent px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink transition enabled:hover:brightness-110 disabled:opacity-40 sm:px-6"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>

      <FoodSuggestPopup
        hintOpen={foodHint}
        expanded={foodExpanded}
        suggestions={foodSuggestions}
        onDismissHint={() => {
          setFoodHint(false);
          setFoodExpanded(false);
        }}
        onExpand={() => setFoodExpanded(true)}
        onCollapse={() => setFoodExpanded(false)}
        onPropose={(s: FoodSuggestion) => {
          if (!chat) return;
          runChatWrite(() => proposeTable(chat.id, s));
        }}
      />
    </>
  );
}

export default function ChatThreadPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh" />}>
      <ChatThreadInner />
    </Suspense>
  );
}
