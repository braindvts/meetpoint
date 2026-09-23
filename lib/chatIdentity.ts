/** Follow local chat id → server chat id, including a chain of remaps. */
export function resolveChatId(id: string, aliases: Record<string, string>): string {
  let current = id;
  const seen = new Set<string>();
  while (aliases[current] && !seen.has(current)) {
    seen.add(current);
    current = aliases[current];
  }
  return current;
}

export function withChatAlias(
  aliases: Record<string, string>,
  fromId: string,
  toId: string
): Record<string, string> {
  const next = { ...aliases, [fromId]: toId };
  for (const [key, value] of Object.entries(next)) {
    if (value === fromId) next[key] = toId;
  }
  return next;
}
