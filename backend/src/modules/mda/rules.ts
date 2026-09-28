/** Pure decision rules, unit-tested without a database. */
const BLOCKING = new Set(["ACTION_NEEDED", "REJECTED", "EXPIRED"]);
export function approvalBlockers(reqs: { status: string; name: string }[]): string[] {
  return reqs.filter((r) => BLOCKING.has(r.status)).map((r) => r.name);
}
export const DECISIONS = ["approve", "clarification", "return", "escalate"] as const;
export type Decision = (typeof DECISIONS)[number];
export function nextApplicationStatus(action: Decision, allStagesDone: boolean, current: string): string {
  if (action === "clarification") return "ACTION_REQUIRED";
  if (action === "return") return "RETURNED";
  if (action === "approve") return allStagesDone ? "COMPLETED" : "IN_REVIEW";
  return current; // escalate does not change the applicant-facing status
}
