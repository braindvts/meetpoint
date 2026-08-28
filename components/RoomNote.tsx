"use client";

import { useMemo } from "react";

const NOTES = [
  "Introductions tonight favor builders who can actually help each other.",
  "Distance is optional. Intent is not.",
  "The best tables start as a quiet message.",
  "Nearby first — unless ambition travels farther.",
  "Your card is how the room first sees you.",
];

export default function RoomNote() {
  const note = useMemo(() => {
    const day = Math.floor(Date.now() / 86_400_000);
    return NOTES[day % NOTES.length];
  }, []);

  return (
    <p className="mp-reveal mp-reveal-delay-1 mb-5 border-l border-accent/40 pl-4 text-[0.95rem] font-normal leading-relaxed text-ivory/70 sm:mb-7 sm:text-base">
      {note}
    </p>
  );
}
