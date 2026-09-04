import type { MatchResult } from "./match";
import { getMeetingsAttended } from "./store";
import { reputationScoreForMeetings, tierForProfile } from "./tiers";
import type { MyProfile, Person } from "./types";

/** Convert the signed-in profile into a Person so we can preview their public card. */
export function profileToPerson(profile: MyProfile): Person {
  const linkedIn = profile.verifications?.find((v) => v.method === "linkedin")?.value;
  const website = profile.verifications?.find((v) => v.method === "website")?.value;
  const portfolio = profile.verifications?.find((v) => v.method === "portfolio")?.value;

  return {
    id: "me",
    name: profile.name,
    jobTitle: profile.jobTitle,
    ideaTags: profile.ideaTags,
    lookingFor: profile.lookingFor || [],
    bio: profile.bio,
    city: profile.city,
    travel: profile.travel,
    photoUrl: profile.photo,
    verifications: (profile.verifications || []).map((v) => v.method),
    linkedInUrl: linkedIn?.startsWith("http") ? linkedIn : undefined,
    websiteUrl: website?.startsWith("http") ? website : undefined,
    portfolioUrl: portfolio?.startsWith("http") ? portfolio : undefined,
    work: profile.work,
    black: profile.black,
    blackConnections: profile.blackConnections,
  };
}

/** Synthetic match result for rendering MatchCard as “how others see you”. */
export function selfCardMatch(profile: MyProfile, blackConnections?: number): MatchResult {
  const person = {
    ...profileToPerson(profile),
    blackConnections: blackConnections ?? profile.blackConnections,
  };
  const meetings = getMeetingsAttended(profile);
  const tier = tierForProfile(profile, meetings);
  return {
    person,
    score: 100,
    sharedIdeas: profile.ideaTags.slice(0, 3),
    sameBusiness: false,
    canHelp: false,
    helpReasons: [],
    sameJob: false,
    sharedLookingFor: (profile.lookingFor || []).slice(0, 3),
    intentFit: true,
    reputationScore: reputationScoreForMeetings(meetings),
    reputationStatus: "standing",
    tier,
    distance: 0,
    isLocal: true,
    reachable: true,
  };
}
