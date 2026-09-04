"use client";

import { useCallback, useEffect, useState } from "react";
import BlackBadge from "@/components/BlackBadge";
import BlackConnectionBadge from "@/components/BlackConnectionBadge";
import type { BlackInviteKind } from "@/lib/black";
import {
  amBlack,
  blackConnectionWith,
  blackInviteWith,
  canRaiseBlackInvite,
  isPeerBlack,
  loadBlackInvites,
  myBlackConnectionCount,
  raiseBlackInvite,
  respondBlackInvite,
  scheduleDemoInviteResponse,
  type LocalBlackInvite,
} from "@/lib/blackStore";
import { track } from "@/lib/analytics";

interface Props {
  chatId: string;
  /** The other people in this conversation. */
  peers: { id: string; name: string }[];
}

/**
 * BLACK inside a private conversation. This is the only place a BLACK
 * invitation can be raised — never from a public profile or a plain connection.
 *
 * A BLACK member extends one; anyone else requests one from a BLACK member.
 * Accepting awards BLACK CONNECTION to whichever side isn't BLACK. Nobody
 * becomes BLACK here.
 */
export default function BlackInvitePanel({ chatId, peers }: Props) {
  const [invites, setInvites] = useState<LocalBlackInvite[]>([]);
  const [mine, setMine] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [connections, setConnections] = useState(0);

  const sync = useCallback(() => {
    setInvites(loadBlackInvites());
    setMine(amBlack());
    setConnections(myBlackConnectionCount());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener("meetpoint:black-changed", sync);
    window.addEventListener("meetpoint:profile-changed", sync);
    return () => {
      window.removeEventListener("meetpoint:black-changed", sync);
      window.removeEventListener("meetpoint:profile-changed", sync);
    };
  }, [sync]);

  // A one-to-one thread is the only place this makes sense.
  const peer = peers.length === 1 ? peers[0] : null;
  if (!peer) return null;

  const peerBlack = isPeerBlack(peer.id);
  const settled = blackConnectionWith(peer.id);
  const pending = blackInviteWith(peer.id);
  const incoming = invites.find(
    (i) => i.peerId === peer.id && i.direction === "in" && i.status === "pending"
  );
  const first = peer.name.split(" ")[0];

  // Nothing to show between two ordinary members.
  if (!mine && !peerBlack && !settled) return null;

  async function raise(kind: BlackInviteKind) {
    setBusy(true);
    setError("");
    setNote("");
    const result = await raiseBlackInvite({ peerId: peer!.id, chatId, kind });
    if (!result.ok) {
      setError(result.error || "Could not send that.");
    } else {
      track(kind === "meeting" ? "black_meeting_requested" : "black_invite_sent");
      setNote(
        kind === "meeting"
          ? `Business meeting request sent to ${first}.`
          : mine
            ? `BLACK connection extended to ${first}.`
            : `Request sent to ${first}.`
      );
      if (result.invite) scheduleDemoInviteResponse(result.invite.id, peer!.id);
    }
    sync();
    setBusy(false);
  }

  async function answer(inviteId: string, action: "accept" | "decline") {
    setBusy(true);
    setError("");
    const result = await respondBlackInvite(inviteId, action);
    if (!result.ok) {
      setError(result.error || "Could not answer that.");
    } else if (action === "decline") {
      setNote("Declined. Nothing was awarded.");
    } else if (result.awaitingMeeting) {
      setNote("Accepted. Book the table to settle the connection.");
    } else if (result.awarded) {
      setNote("Accepted. BLACK CONNECTION awarded.");
      track("black_connection_awarded");
    } else {
      setNote("Accepted.");
    }
    sync();
    setBusy(false);
  }

  return (
    <section className="rounded-2xl border border-white/12 bg-[#0b0a09] px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <BlackBadge size="xs" />
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
            {settled ? "Network connection" : "Network"}
          </p>
        </div>
        {connections > 0 && <BlackConnectionBadge count={connections} variant="compact" />}
      </div>

      {settled ? (
        <p className="mt-2 text-[13px] leading-relaxed text-ivory/70">
          {settled.iAmBlack
            ? `${first} holds a BLACK CONNECTION through you.`
            : `You hold a BLACK CONNECTION through ${first}.`}{" "}
          <span className="text-muted">
            {settled.source === "meeting" ? "Earned at a booked table." : "From a private invitation."}
          </span>
        </p>
      ) : incoming ? (
        <>
          <p className="mt-2 text-[13px] leading-relaxed text-ivory/80">
            {incoming.kind === "meeting"
              ? `${first} wants to arrange a business meeting inside the BLACK network.`
              : incoming.fromBlack
                ? `${first} is extending you a BLACK connection.`
                : `${first} is asking to take this into the BLACK network.`}
          </p>
          <p className="mt-1 text-[12px] text-muted">
            Accepting creates a BLACK network connection. It does not make anyone BLACK.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => answer(incoming.id, "accept")}
              className="flex-1 rounded-full bg-gradient-to-b from-accent-2 to-accent py-2.5 text-[12px] font-semibold text-ink disabled:opacity-40"
            >
              Accept
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => answer(incoming.id, "decline")}
              className="flex-1 rounded-full border border-white/18 py-2.5 text-[12px] font-medium text-ivory/70 disabled:opacity-40"
            >
              Decline
            </button>
          </div>
        </>
      ) : pending ? (
        <p className="mt-2 text-[13px] leading-relaxed text-ivory/70">
          {pending.kind === "meeting"
            ? `Business meeting request waiting on ${first}.`
            : `Waiting on ${first} to answer.`}
        </p>
      ) : canRaiseBlackInvite(peer.id) ? (
        <>
          <p className="mt-2 text-[13px] leading-relaxed text-ivory/70">
            {mine
              ? `Take this somewhere serious — extend ${first} a place in your BLACK network, or arrange a business meeting.`
              : `${first} is BLACK. Ask to take this private, or request a business meeting.`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => raise("connection")}
              className="rounded-full bg-gradient-to-b from-accent-2 to-accent px-4 py-2.5 text-[12px] font-semibold text-ink disabled:opacity-40"
            >
              {mine ? "Extend BLACK connection" : "Request BLACK connection"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => raise("meeting")}
              className="rounded-full border border-accent/40 px-4 py-2.5 text-[12px] font-medium text-accent disabled:opacity-40"
            >
              Request business meeting
            </button>
          </div>
        </>
      ) : null}

      {note && <p className="mt-2.5 text-[12px] text-accent-2">{note}</p>}
      {error && <p className="mt-2.5 text-[12px] text-red-400">{error}</p>}
    </section>
  );
}
