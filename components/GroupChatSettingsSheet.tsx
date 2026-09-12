"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import { updateChatMeta } from "@/lib/store";
import { showToast } from "@/lib/notify";
import type { GroupChat } from "@/lib/types";

type Props = {
  open: boolean;
  chat: GroupChat;
  onClose: () => void;
  onSaved: (chat: GroupChat) => void;
};

const MAX_BYTES = 900_000; // keep localStorage light

/** Edit group name + optional group photo after the GC is created. */
export default function GroupChatSettingsSheet({ open, chat, onClose, onSaved }: Props) {
  const [name, setName] = useState(chat.name);
  const [photo, setPhoto] = useState(chat.photo || "");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(chat.name);
    setPhoto(chat.photo || "");
  }, [open, chat.id, chat.name, chat.photo]);

  if (!open) return null;

  function save() {
    const updated = updateChatMeta(chat.id, {
      name: name.trim() || chat.name,
      photo: photo.trim() ? photo.trim() : null,
    });
    if (updated) {
      onSaved(updated);
      showToast("Group updated");
      onClose();
    }
  }

  function onFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) {
      showToast("Choose an image file");
      return;
    }
    if (file.size > MAX_BYTES) {
      showToast("Image too large — try a smaller photo");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;
      setPhoto(result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-settings-title"
        className="relative z-[1] w-full max-w-md overflow-hidden rounded-t-2xl border border-accent/20 bg-[#12110f] sm:rounded-2xl"
      >
        <div className="border-b border-line/50 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <h2 id="group-settings-title" className="text-lg font-medium text-ivory">
              Group settings
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-[12px] font-medium text-muted hover:text-ivory"
            >
              Close
            </button>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="flex flex-col items-center gap-3">
            <Avatar
              src={photo || undefined}
              name={name || chat.name}
              sizeCls="h-20 w-20"
              rounded="rounded-[18px]"
            />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-xl border border-accent/30 px-3 py-2 text-[11px] font-medium text-accent"
              >
                Upload photo
              </button>
              {photo ? (
                <button
                  type="button"
                  onClick={() => setPhoto("")}
                  className="rounded-xl border border-line px-3 py-2 text-[11px] font-medium text-muted"
                >
                  Remove
                </button>
              ) : null}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <p className="text-center text-[12px] text-muted">
              Upload a photo from your device — no URL needed.
            </p>
          </div>

          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Group name
            </span>
            <input
              type="text"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-accent/20 bg-ink/60 px-3 py-2.5 text-sm text-ivory outline-none focus:border-accent/45"
            />
          </label>

          <button
            type="button"
            onClick={save}
            className="mp-btn-lux w-full rounded-xl bg-gradient-to-b from-accent-2 to-accent py-3 text-[12px] font-semibold text-ink"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
