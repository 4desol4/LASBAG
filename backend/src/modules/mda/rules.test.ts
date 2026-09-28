import { describe, it, expect } from "vitest";
import { approvalBlockers, nextApplicationStatus } from "./rules";
describe("MDA decision rules", () => {
  it("blocks approval while a requirement needs action", () => expect(approvalBlockers([{ status: "VERIFIED", name: "A" }, { status: "ACTION_NEEDED", name: "Drainage" }])).toEqual(["Drainage"]));
  it("allows approval when nothing blocks", () => expect(approvalBlockers([{ status: "UNDER_REVIEW", name: "A" }])).toEqual([]));
  it("clarification puts the application in ACTION_REQUIRED", () => expect(nextApplicationStatus("clarification", false, "IN_REVIEW")).toBe("ACTION_REQUIRED"));
  it("final approval completes the application", () => expect(nextApplicationStatus("approve", true, "IN_REVIEW")).toBe("COMPLETED"));
  it("escalation leaves the applicant status alone", () => expect(nextApplicationStatus("escalate", false, "IN_REVIEW")).toBe("IN_REVIEW"));
});
