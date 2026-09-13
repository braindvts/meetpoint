import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CITIES } from "./cities";
import { EVENTS, getEventById } from "./events";
import {
  extractMemberSignals,
  isStrongEventMatch,
  rankEvents,
  scoreEvent,
} from "./eventMatch";
import type { EventMatchResult, MemberMatchInput } from "./eventMatch";

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
  city: city("Chicago"),
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
  city: city("Chicago"),
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
  it("ranks the founders table first for an AI founder seeking intros", () => {
    const ranked = rankEvents(FOUNDER, EVENTS);
    assert.ok(ranked.length >= 1);
    const top = ranked[0];
    assert.equal(top.event.id, "evt-black-tie-ny");
    assert.ok(top.score >= 50);
    assert.ok(top.topicOverlap.includes("SaaS") || top.topicOverlap.includes("AI / Machine Learning"));
    assert.ok(top.intentOverlap.includes("Co-founder") || top.intentOverlap.includes("Partnership"));
    assert.ok(top.reasons.length >= 1);
    assert.ok(isStrongEventMatch(top));
  });

  it("surfaces brand/design and health rooms for a designer building wellness", () => {
    const ranked = rankEvents(DESIGNER, EVENTS);
    const brand = byId(ranked, "evt-mkt-chicago");
    const health = byId(ranked, "evt-health-boston");
    const saas = byId(ranked, "evt-online-saas");
    assert.ok(brand || saas, "design/brand or SaaS operators should rank");
    const designHit = brand || saas;
    assert.ok(designHit!.score >= 40);
    assert.ok(
      designHit!.reasons.some((r) => /design|hiring|saas|health|product designer|chicago/i.test(r.label)),
      JSON.stringify(designHit!.reasons)
    );
    assert.ok(health || saas, "health or SaaS should also fit this profile");
  });
});

describe("weak matches", () => {
  it("does not recommend a luxury maison salon to a restaurant owner", () => {
    const luxury = getEventById("evt-lux-paris")!;
    const scored = scoreEvent(HOSPITALITY, luxury, { catalog: EVENTS });
    assert.ok(scored.score < 38, `expected weak score, got ${scored.score}`);
    const ranked = rankEvents(HOSPITALITY, EVENTS);
    assert.equal(byId(ranked, "evt-lux-paris"), undefined);
    assert.equal(byId(ranked, "evt-ai-summit-sf"), undefined);
  });

  it("does not dump a marketing circle onto a trucker", () => {
    const ranked = rankEvents(WEAK_FOR_DESIGN, EVENTS);
    assert.equal(byId(ranked, "evt-mkt-chicago"), undefined);
    assert.equal(byId(ranked, "evt-lux-paris"), undefined);
    assert.ok(
      byId(ranked, "evt-biz-dubai") || ranked.length === 0,
      "logistics/trade is the only catalog fit — or nothing"
    );
  });

  it("keeps the ranked list precise instead of returning the whole catalog", () => {
    const ranked = rankEvents(FOUNDER, EVENTS);
    assert.ok(ranked.length < EVENTS.length);
    assert.ok(ranked.length <= 8);
    assert.ok(ranked.every((m) => m.score >= 38));
  });
});

describe("sparse / cold-start profiles", () => {
  it("still finds a design/brand room from job title alone", () => {
    const ranked = rankEvents(SPARSE_DESIGNER, EVENTS);
    const brand = byId(ranked, "evt-mkt-chicago");
    assert.ok(brand, "job title Product Designer should unlock the brand circle");
    assert.ok(brand!.sparse);
    assert.ok(brand!.roleOverlap.includes("designer"));
    assert.equal(byId(ranked, "evt-re-miami"), undefined);
    assert.equal(byId(ranked, "evt-lux-paris"), undefined);
  });

  it("uses looking-for Investor when the rest of the card is empty", () => {
    const ranked = rankEvents(SPARSE_INVESTOR_SEEKER, EVENTS);
    const capital = byId(ranked, "evt-fintech-london") || byId(ranked, "evt-invest-nyc");
    assert.ok(capital, "Investor intent should surface a capital room");
    assert.ok(capital!.intentOverlap.includes("Investor"));
  });
});

describe("feedback hooks", () => {
  it("drops an event the member passed", () => {
    const ranked = rankEvents(FOUNDER, EVENTS, [
      { eventId: "evt-black-tie-ny", status: "passed" },
    ]);
    assert.equal(byId(ranked, "evt-black-tie-ny"), undefined);
    assert.ok(ranked.length >= 1, "other strong events should remain");
  });

  it("boosts a similar event after they mark one as going", () => {
    const summit = getEventById("evt-ai-summit-sf")!;
    const baseline = scoreEvent(FOUNDER, summit, { catalog: EVENTS });
    const boosted = scoreEvent(FOUNDER, summit, {
      catalog: EVENTS,
      interests: [{ eventId: "evt-black-tie-ny", status: "going" }],
    });
    assert.ok(boosted.score >= baseline.score);
    assert.ok(boosted.reasons.some((r) => /going|saved|like an event/i.test(r.label)));
  });
});
