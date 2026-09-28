import type { ProjectAnswers } from "../../shared/index.js";

export type Op = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in";
export type Condition =
  | { field: keyof ProjectAnswers; op: Op; value: unknown }
  | { all: Condition[] }
  | { any: Condition[] };
export interface RuleLike {
  id: string;
  requirementDefinitionId: string;
  condition: Condition | null;
  active: boolean;
}

const cmp = (a: any, op: Op, b: any) =>
  op === "eq"
    ? a === b
    : op === "neq"
      ? a !== b
      : op === "gt"
        ? a > b
        : op === "gte"
          ? a >= b
          : op === "lt"
            ? a < b
            : op === "lte"
              ? a <= b
              : Array.isArray(b) && b.includes(a);

export function evaluate(c: Condition | null, a: ProjectAnswers): boolean {
  if (!c) return true; // unconditional rule
  if ("all" in c) return c.all.every((x) => evaluate(x, a));
  if ("any" in c) return c.any.some((x) => evaluate(x, a));
  return cmp(a[c.field], c.op, c.value);
}

/** Pure function: which requirement definitions apply to these answers. Runs on the server only. */
export function applicableRequirementIds(
  rules: RuleLike[],
  a: ProjectAnswers,
): string[] {
  const ids = new Set<string>();
  for (const r of rules)
    if (r.active && evaluate(r.condition, a))
      ids.add(r.requirementDefinitionId);
  return [...ids];
}
