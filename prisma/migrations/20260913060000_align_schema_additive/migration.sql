-- Bring a db-push or slim-init database up to the current Prisma schema.
-- Additive only: CREATE / ADD COLUMN / INDEX IF NOT EXISTS. Never DROP.
-- Especially never DROP Report.alsoBlocked, category, notes, or status.

ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "linkedInId" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "appleId" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "jobTitle" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "bio" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "photo" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "cityName" TEXT NOT NULL DEFAULT 'New York';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "cityCountry" TEXT NOT NULL DEFAULT 'USA';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "cityLat" DOUBLE PRECISION NOT NULL DEFAULT 40.7128;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "cityLng" DOUBLE PRECISION NOT NULL DEFAULT -74.006;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "travel" TEXT NOT NULL DEFAULT 'worldwide';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "meetPreference" TEXT NOT NULL DEFAULT 'open';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "lookingForJson" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "ideaTagsJson" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "verificationsJson" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "workJson" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "black" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "blackSince" TIMESTAMP(3);
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "blackSource" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "premierActive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "premierInterval" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "premierStartedAt" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "premierTrialEndsAt" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "meetingsAttended" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "Member_googleId_key" ON "Member"("googleId");
CREATE UNIQUE INDEX IF NOT EXISTS "Member_appleId_key" ON "Member"("appleId");
CREATE UNIQUE INDEX IF NOT EXISTS "Member_email_key" ON "Member"("email");

CREATE TABLE IF NOT EXISTS "BlackInvite" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "chatId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'connection',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "BlackInvite_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BlackInvite_toId_status_idx" ON "BlackInvite"("toId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "BlackInvite_fromId_toId_kind_key" ON "BlackInvite"("fromId", "toId", "kind");

CREATE TABLE IF NOT EXISTS "BlackConnection" (
    "id" TEXT NOT NULL,
    "blackMemberId" TEXT NOT NULL,
    "peerId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'invite',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlackConnection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BlackConnection_peerId_idx" ON "BlackConnection"("peerId");
CREATE UNIQUE INDEX IF NOT EXISTS "BlackConnection_blackMemberId_peerId_key" ON "BlackConnection"("blackMemberId", "peerId");

CREATE TABLE IF NOT EXISTS "Block" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Block_blockedId_idx" ON "Block"("blockedId");
CREATE UNIQUE INDEX IF NOT EXISTS "Block_blockerId_blockedId_key" ON "Block"("blockerId", "blockedId");

CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL DEFAULT '',
    "memberId" TEXT,
    "metaJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AnalyticsEvent_name_createdAt_idx" ON "AnalyticsEvent"("name", "createdAt");

CREATE TABLE IF NOT EXISTS "Connection" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "meetupJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Connection_toId_idx" ON "Connection"("toId");
CREATE UNIQUE INDEX IF NOT EXISTS "Connection_fromId_toId_key" ON "Connection"("fromId", "toId");

CREATE TABLE IF NOT EXISTS "Chat" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ChatMember" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "ChatMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ChatMember_chatId_memberId_key" ON "ChatMember"("chatId", "memberId");

CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "system" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Message_chatId_createdAt_idx" ON "Message"("chatId", "createdAt");

CREATE TABLE IF NOT EXISTS "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "peerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- Report moderation columns (again, IF NOT EXISTS — live rows stay).
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'open';
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "alsoBlocked" BOOLEAN NOT NULL DEFAULT false;

DO $$ BEGIN
  ALTER TABLE "BlackInvite" ADD CONSTRAINT "BlackInvite_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "BlackInvite" ADD CONSTRAINT "BlackInvite_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "BlackConnection" ADD CONSTRAINT "BlackConnection_blackMemberId_fkey" FOREIGN KEY ("blackMemberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "BlackConnection" ADD CONSTRAINT "BlackConnection_peerId_fkey" FOREIGN KEY ("peerId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Connection" ADD CONSTRAINT "Connection_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Connection" ADD CONSTRAINT "Connection_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ChatMember" ADD CONSTRAINT "ChatMember_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ChatMember" ADD CONSTRAINT "ChatMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
