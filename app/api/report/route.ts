import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { rateLimit } from "@/lib/rateLimit";
import { publicError } from "@/lib/safeError";
import { sanitizeText } from "@/lib/sanitize";
import { parseBody } from "@/lib/validation/parse";
import {
  reportAdminPatchSchema,
  reportSchema,
} from "@/lib/validation/safety";

/** Member submits a report. Optional alsoBlock removes the peer from their room. */
export async function POST(req: Request) {
  try {
    const limited = rateLimit(req, { name: "report", limit: 10, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    const me = await getCurrentMember();
    if (!me) {
      return NextResponse.json(
        { ok: false, error: "Sign in so we can attach your report." },
        { status: 401 }
      );
    }

    const parsed = await parseBody(req, reportSchema);
    if (!parsed.ok) return parsed.response;

    const peerId = parsed.data.peerId;
    if (peerId === me.id) {
      return NextResponse.json(
        { ok: false, error: "You can’t report yourself." },
        { status: 400 }
      );
    }

    const peer = await prisma.member.findUnique({
      where: { id: peerId },
      select: { id: true, name: true },
    });
    if (!peer) {
      return NextResponse.json({ ok: false, error: "Member not found" }, { status: 404 });
    }

    const reason = sanitizeText(parsed.data.reason, 500);
    if (reason.length < 3) {
      return NextResponse.json({ ok: false, error: "Reason too short" }, { status: 400 });
    }

    const category = parsed.data.category || "other";
    const alsoBlock = parsed.data.alsoBlock === true;

    // Avoid duplicate open reports for the same pair within 24h
    const dayAgo = new Date(Date.now() - 24 * 60 * 60_000);
    const dup = await prisma.report.findFirst({
      where: {
        reporterId: me.id,
        peerId,
        status: { in: ["open", "reviewing"] },
        createdAt: { gte: dayAgo },
      },
    });
    if (dup) {
      if (alsoBlock) {
        await prisma.block.upsert({
          where: { blockerId_blockedId: { blockerId: me.id, blockedId: peerId } },
          create: { blockerId: me.id, blockedId: peerId },
          update: {},
        });
        await prisma.connection.deleteMany({
          where: {
            OR: [
              { fromId: me.id, toId: peerId },
              { fromId: peerId, toId: me.id },
            ],
          },
        });
      }
      return NextResponse.json(
        {
          ok: true,
          duplicate: true,
          reportId: dup.id,
          alsoBlocked: alsoBlock,
          message: alsoBlock
            ? "You already reported them. They’re blocked from your room."
            : "You already have an open report for this member. We’ll keep reviewing it.",
        },
        { status: 200 }
      );
    }

    if (alsoBlock) {
      await prisma.block.upsert({
        where: { blockerId_blockedId: { blockerId: me.id, blockedId: peerId } },
        create: { blockerId: me.id, blockedId: peerId },
        update: {},
      });
      await prisma.connection.deleteMany({
        where: {
          OR: [
            { fromId: me.id, toId: peerId },
            { fromId: peerId, toId: me.id },
          ],
        },
      });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: me.id,
        peerId,
        category,
        reason,
        alsoBlocked: alsoBlock,
        status: "open",
      },
    });

    return NextResponse.json({
      ok: true,
      reportId: report.id,
      alsoBlocked: alsoBlock,
      message: alsoBlock
        ? "Report received. They’re blocked from your room."
        : "Report received. We’ll review it.",
    });
  } catch (e) {
    return publicError(e, "Failed to submit report");
  }
}

/** Operator queue — requires ADMIN_SECRET. */
export async function GET(req: Request) {
  try {
    const auth = requireAdmin(req);
    if (!auth.ok) return auth.response;

    const limited = rateLimit(req, { name: "report-admin-get", limit: 60, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "open";
    const where =
      status === "all"
        ? {}
        : { status: status === "open" ? { in: ["open", "reviewing"] } : status };

    const rows = await prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const ids = [...new Set(rows.flatMap((r) => [r.reporterId, r.peerId]))];
    const members = await prisma.member.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        cityName: true,
        black: true,
        photo: true,
      },
    });
    const byId = Object.fromEntries(members.map((m) => [m.id, m]));

    return NextResponse.json({
      ok: true,
      reports: rows.map((r) => ({
        id: r.id,
        category: r.category,
        reason: r.reason,
        status: r.status,
        notes: r.notes,
        alsoBlocked: r.alsoBlocked,
        createdAt: r.createdAt.toISOString(),
        reviewedAt: r.reviewedAt?.toISOString() || null,
        reporter: byId[r.reporterId] || { id: r.reporterId, name: "Unknown" },
        peer: byId[r.peerId] || { id: r.peerId, name: "Unknown" },
      })),
    });
  } catch (e) {
    return publicError(e, "Failed to load reports");
  }
}

/** Update report status / notes — requires ADMIN_SECRET. */
export async function PATCH(req: Request) {
  try {
    const auth = requireAdmin(req);
    if (!auth.ok) return auth.response;

    const limited = rateLimit(req, { name: "report-admin-patch", limit: 40, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    const parsed = await parseBody(req, reportAdminPatchSchema);
    if (!parsed.ok) return parsed.response;

    const existing = await prisma.report.findUnique({ where: { id: parsed.data.reportId } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Report not found" }, { status: 404 });
    }

    const notes =
      parsed.data.notes !== undefined
        ? sanitizeText(parsed.data.notes, 1000)
        : existing.notes;

    const updated = await prisma.report.update({
      where: { id: existing.id },
      data: {
        status: parsed.data.status,
        notes,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      report: {
        id: updated.id,
        status: updated.status,
        notes: updated.notes,
        reviewedAt: updated.reviewedAt?.toISOString() || null,
      },
    });
  } catch (e) {
    return publicError(e, "Failed to update report");
  }
}
