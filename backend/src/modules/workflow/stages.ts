import {
  STAGES,
  RequirementStatus,
  type StageKey,
} from "../../shared/index.js";

export interface StageTask {
  stage: StageKey;
  mandatory: boolean;
  status: string;
}
const DONE = new Set<string>([
  RequirementStatus.VERIFIED,
  RequirementStatus.NOT_REQUIRED,
]);

/** A stage is complete only when every mandatory task in it is verified (or not required). Data alone never approves. */
export function isStageComplete(tasks: StageTask[], stage: StageKey): boolean {
  const own = tasks.filter((t) => t.stage === stage && t.mandatory);
  return own.length > 0 && own.every((t) => DONE.has(t.status));
}

export function computeJourney(tasks: StageTask[]) {
  let current: StageKey | null = null;
  const stages = STAGES.map((s) => {
    const complete = isStageComplete(tasks, s.key);
    const state = complete
      ? "COMPLETED"
      : current === null
        ? ((current = s.key), "IN_PROGRESS")
        : "PENDING";
    return { ...s, state };
  });
  const completed = stages.filter((s) => s.state === "COMPLETED").length;
  return {
    stages,
    currentStage: current,
    progress: Math.round(
      ((completed + (current && completed > 0 ? 0.5 : 0)) / STAGES.length) *
        100,
    ),
  };
}

/** A clarification affects only the named requirement; the stage and journey are untouched. */
export const clarificationTransition = {
  from: RequirementStatus.UNDER_REVIEW,
  to: RequirementStatus.ACTION_NEEDED,
} as const;
