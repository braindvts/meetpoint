import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CITIES } from "./cities";
import { CONCLAVE_TABLES, eventById } from "./events";
import {
  extractMemberSignals,
  isStrongEventMatch,
  rankEvents,
  scoreEvent,
} from "./eventMatch";
import type { EventMatchResult, MemberMatchInput } from "./eventTypes";

function city(name: string) {
  const found = CITIES.find((c) => c.name === name);
  if (!found) throw new Error(name);
  return found;
}

const FOUNDER: MemberMatchInput = {
  jobTitle: "Founder",
  ideaTags: ["AI / Machine Learning", "SaaS"],
  lookingFor: ["Co-founder", "Partnership"],
  bio: "Building AI tools on nights and weekends. Looking for founder intros and a technical co-founder.",
  city: city("New York"),
  work: [{ title: "Briefly AI", description: "Meeting notes into action items." }],
};

const DESIGNER: MemberMatchInput = {
  jobTitle: "Product Designer",
  ideaTags: ["SaaS", "Health & Fitness"],
  lookingFor: ["Hiring", "Co-founder"],
  bio: "Designer turned founder. Looking for a design career salon and technical partners for a wellness app.",
  city: city("Singapore"),
};

const HOSPITALITY: MemberMatchInput = {
  jobTitle: "Restaurant Owner",
  ideaTags: ["Food & Restaurants", "E-commerce"],
  lookingFor: ["Partnership", "Clients"],
  bio: "Own two taquerias, want to franchise. Happy to host.",
  city: city("Mexico City"),
};

const SPARSE_DESIGNER: MemberMatchInput = {
  jobTitle: "Product Designer",
  ideaTags: [],
  lookingFor: [],
  bio: "",
  city: city("Singapore"),
};

const SPARSE_INVESTOR_SEEKER: MemberMatchInput = {
  jobTitle: "Founder",
  ideaTags: [],
  lookingFor: ["Investor"],
  bio: "",
  city: city("London"),
};

const WEAK_FOR_DESIGN: MemberMatchInput = {
  jobTitle: "Truck Driver",
  ideaTags: ["Trucking & Logistics"],
  lookingFor: ["Networking"],
  bio: "Owner-operator saving for a second truck.",
  city: city("Atlanta"),
};

function byId(matches: EventMatchResult[], id: string) {
  return matches.find((m) => m.event.id === id);
}

describe("signal extraction", () => {
  it("pulls intents and roles out of a founder bio", () => {
    const s = extractMemberSignals(FOUNDER);
    assert.ok(s.roles.includes("founder"));
    assert.ok(s.lookingFor.includes("Co-founder"));
    assert.ok(s.bioIntents.includes("Co-founder") || s.phrases.some((p) => /founder/i.test(p)));
    assert.equal(s.sparse, false);
  });

  it("marks a thin profile as sparse", () => {
    const s = extractMemberSignals(SPARSE_DESIGNER);
    assert.equal(s.sparse, true);
    assert.ok(s.roles.includes("designer"));
  });
});

describe("strong matches", () => {
  it("ranks founder-intro dinner first for an AI founder seeking intros", () => {
    const ranked = rankEvents(FOUNDER, CONCLAVE_TABLES);
    assert.ok(ranked.length >= 1);
    const top = ranked[0];
    assert.equal(top.event.id, "t-founder-intros-nyc");
    assert.ok(top.score >= 50);
    assert.ok(top.topicOverlap.includes("SaaS") || top.topicOverlap.includes("AI / Machine Learning"));
    assert.ok(top.intentOverlap.includes("Co-founder") || top.intentOverlap.includes("Partnership"));
    assert.ok(top.reasons.length >= 1);
    assert.ok(isStrongEventMatch(top));
  });

  it("surfaces the design careers salon for a designer seeking that path", () => {
    const ranked = rankEvents(DESIGNER, CONCLAVE_TABLES);
    const design = byId(ranked, "t-design-careers-sg");
    const wellness = byId(ranked, "t-wellness-founders-sg");
    assert.ok(design, "design salon should rank");
    assert.ok(design!.score >= 45);
    assert.ok(
      design!.reasons.some((r) => /design|hiring|singapore|product designer|saas/i.test(r.label)),
      JSON.stringify(design!.reasons)
    );
    assert.ok(wellness, "wellness founders supper should also fit this profile");
    assert.ok(design!.score >= 40);
  });
});

describe("weak matches", () => {
  it("does not recommend a crypto circle to a restaurant owner", () => {
    const crypto = eventById("t-crypto-dubai")!;
    const scored = scoreEvent(HOSPITALITY, crypto);
    assert.ok(scored.score < 34, `expected weak score, got ${scored.score}`);
    const ranked = rankEvents(HOSPITALITY, CONCLAVE_TABLES);
    assert.equal(byId(ranked, "t-crypto-dubai"), undefined);
    assert.ok(byId(ranked, "t-hospitality-cdmx"), "hospitality table should still appear");
  });

  it("does not dump a design salon onto a trucker", () => {
    const ranked = rankEvents(WEAK_FOR_DESIGN, CONCLAVE_TABLES);
    assert.equal(byId(ranked, "t-design-careers-sg"), undefined);
    assert.ok(
      byId(ranked, "t-fleet-atlanta") || byId(ranked, "t-freight-lagos"),
      "logistics tables should be the ones that survive"
    );
  });

  it("keeps the ranked list precise instead of returning the whole catalog", () => {
    const ranked = rankEvents(FOUNDER, CONCLAVE_TABLES);
    assert.ok(ranked.length < CONCLAVE_TABLES.length);
    assert.ok(ranked.length <= 8);
    assert.ok(ranked.every((m) => m.score >= 38));
  });
});

describe("sparse / cold-start profiles", () => {
  it("still finds a design table from job title alone", () => {
    const ranked = rankEvents(SPARSE_DESIGNER, CONCLAVE_TABLES);
    const design = byId(ranked, "t-design-careers-sg");
    assert.ok(design, "job title Product Designer should unlock the design salon");
    assert.ok(design!.sparse);
    assert.ok(design!.roleOverlap.includes("designer"));
    assert.equal(byId(ranked, "t-fleet-atlanta"), undefined);
    assert.equal(byId(ranked, "t-crypto-dubai"), undefined);
  });

  it("uses looking-for Investor when the rest of the card is empty", () => {
    const ranked = rankEvents(SPARSE_INVESTOR_SEEKER, CONCLAVE_TABLES);
    const capital = byId(ranked, "t-investor-night-ldn");
    assert.ok(capital, "Investor intent should surface seed capital night");
    assert.ok(capital!.intentOverlap.includes("Investor"));
    assert.ok(capital!.isLocal);
  });
});

describe("feedback hooks", () => {
  it("drops an event the member passed", () => {
    const ranked = rankEvents(FOUNDER, CONCLAVE_TABLES, [
      { eventId: "t-founder-intros-nyc", status: "passed" },
    ]);
    assert.equal(byId(ranked, "t-founder-intros-nyc"), undefined);
    assert.ok(ranked.length >= 1, "other strong tables should remain");
  });

  it("boosts a similar table after they mark one as going", () => {
    const hiring = eventById("t-hiring-nyc")!;
    const baseline = scoreEvent(FOUNDER, hiring);
    const boosted = scoreEvent(FOUNDER, hiring, {
      interests: [{ eventId: "t-founder-intros-nyc", status: "going" }],
    });
    assert.ok(boosted.score >= baseline.score);
    assert.ok(boosted.reasons.some((r) => /going|saved|like a table/i.test(r.label)));
  });
});
