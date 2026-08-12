import { MatchReason } from "./types";

export function formatMatchReasons(reasons: MatchReason[]): string[] {
  if (!reasons || reasons.length === 0) {
    return ["Both users have complementary student profiles on campus."];
  }
  return reasons.map((r) => r.text);
}
