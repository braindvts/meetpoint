import { isValidEmail } from "@/lib/password";
import {
  INTERLINK_WAITLIST_DATABASE_ID,
  INTERLINK_WAITLIST_DATA_SOURCE_ID,
  INTERLINK_WAITLIST_FORM_URL,
} from "@/lib/waitlistPublic";

export {
  INTERLINK_WAITLIST_DATABASE_ID,
  INTERLINK_WAITLIST_DATA_SOURCE_ID,
  INTERLINK_WAITLIST_FORM_URL,
};

const NOTION_VERSION_DB = "2022-06-28";
const NOTION_VERSION_DATA_SOURCE = "2025-09-03";
const NAME_MAX = 120;

export type WaitlistFields = {
  email: string;
  name: string;
};

export type WaitlistParseResult =
  | { ok: true; value: WaitlistFields }
  | { ok: false; error: string };

export function getNotionToken(): string {
  return (process.env.NOTION_API_KEY || process.env.NOTION_TOKEN || "").trim();
}

export function getWaitlistDatabaseId(): string {
  return (
    process.env.NOTION_WAITLIST_DATABASE_ID?.trim() || INTERLINK_WAITLIST_DATABASE_ID
  );
}

export function getWaitlistDataSourceId(): string {
  return (
    process.env.NOTION_WAITLIST_DATA_SOURCE_ID?.trim() ||
    INTERLINK_WAITLIST_DATA_SOURCE_ID
  );
}

export function getWaitlistFormUrl(): string {
  return (
    process.env.NEXT_PUBLIC_NOTION_WAITLIST_FORM_URL?.trim() ||
    INTERLINK_WAITLIST_FORM_URL
  );
}

export function isWaitlistApiConfigured(): boolean {
  return Boolean(getNotionToken());
}

export function hyphenateNotionId(id: string): string {
  const compact = id.replace(/-/g, "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(compact)) return id;
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
}

export function waitlistTitle(email: string, name: string): string {
  const fromName = name.trim();
  if (fromName) return fromName.slice(0, NAME_MAX);
  const local = email.split("@")[0]?.trim();
  return (local || "Waitlist").slice(0, NAME_MAX);
}

export function parseWaitlistInput(body: unknown): WaitlistParseResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Enter a valid email." };
  }
  const raw = body as { email?: unknown; name?: unknown; company?: unknown };
  if (typeof raw.company === "string" && raw.company.trim()) {
    return { ok: false, error: "Could not join the waitlist." };
  }
  const email = String(raw.email || "")
    .trim()
    .toLowerCase();
  const name = String(raw.name || "").trim().slice(0, NAME_MAX);
  if (!isValidEmail(email)) {
    return { ok: false, error: "Enter a valid email." };
  }
  return { ok: true, value: { email, name } };
}

export function notionPageProperties(email: string, name: string) {
  return {
    Name: {
      title: [{ type: "text" as const, text: { content: waitlistTitle(email, name) } }],
    },
    Email: { email },
    Source: { select: { name: "Waitlist" } },
  };
}

type NotionErrorBody = {
  object?: string;
  status?: number;
  code?: string;
  message?: string;
};

async function notionRequest(
  path: string,
  init: {
    method: string;
    token: string;
    version: string;
    body?: unknown;
  },
): Promise<{ ok: true; json: unknown } | { ok: false; status: number; message: string }> {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${init.token}`,
      "Notion-Version": init.version,
      "Content-Type": "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const json = (await res.json().catch(() => null)) as NotionErrorBody | null;
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      message: json?.message || `Notion request failed (${res.status}).`,
    };
  }
  return { ok: true, json };
}

async function findExistingByEmail(
  token: string,
  email: string,
): Promise<boolean> {
  const databaseId = hyphenateNotionId(getWaitlistDatabaseId());
  const dataSourceId = hyphenateNotionId(getWaitlistDataSourceId());
  const filter = {
    property: "Email",
    email: { equals: email },
  };

  const viaDatabase = await notionRequest(`/databases/${databaseId}/query`, {
    method: "POST",
    token,
    version: NOTION_VERSION_DB,
    body: { filter, page_size: 1 },
  });
  if (viaDatabase.ok) {
    const results = (viaDatabase.json as { results?: unknown[] }).results;
    return Array.isArray(results) && results.length > 0;
  }

  const viaDataSource = await notionRequest(`/data_sources/${dataSourceId}/query`, {
    method: "POST",
    token,
    version: NOTION_VERSION_DATA_SOURCE,
    body: { filter, page_size: 1 },
  });
  if (viaDataSource.ok) {
    const results = (viaDataSource.json as { results?: unknown[] }).results;
    return Array.isArray(results) && results.length > 0;
  }

  return false;
}

export async function createWaitlistSignup(
  fields: WaitlistFields,
): Promise<{ ok: true; already?: boolean } | { ok: false; error: string }> {
  const token = getNotionToken();
  if (!token) {
    return { ok: false, error: "Waitlist is not connected yet." };
  }

  try {
    const already = await findExistingByEmail(token, fields.email);
    if (already) return { ok: true, already: true };

    const properties = notionPageProperties(fields.email, fields.name);
    const databaseId = hyphenateNotionId(getWaitlistDatabaseId());
    const dataSourceId = hyphenateNotionId(getWaitlistDataSourceId());

    const viaDatabase = await notionRequest("/pages", {
      method: "POST",
      token,
      version: NOTION_VERSION_DB,
      body: { parent: { database_id: databaseId }, properties },
    });
    if (viaDatabase.ok) return { ok: true };

    const viaDataSource = await notionRequest("/pages", {
      method: "POST",
      token,
      version: NOTION_VERSION_DATA_SOURCE,
      body: {
        parent: { type: "data_source_id", data_source_id: dataSourceId },
        properties,
      },
    });
    if (viaDataSource.ok) return { ok: true };

    return {
      ok: false,
      error:
        viaDataSource.message ||
        viaDatabase.message ||
        "Could not save your email. Try again.",
    };
  } catch {
    return { ok: false, error: "Could not save your email. Try again." };
  }
}
