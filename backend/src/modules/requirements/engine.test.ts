import { describe, it, expect } from "vitest";
import { applicableRequirementIds } from "./engine";
const base = { developmentType:"COMMERCIAL", location:"Lekki", floors:2, isNewDevelopment:true, nearWaterOrDrainage:false, nearAirport:false } as const;
const rules = [
  { id:"1", requirementDefinitionId:"SURVEY", condition:null, active:true },
  { id:"2", requirementDefinitionId:"STRUCTURAL", condition:{ field:"floors", op:"gt", value:3 } as const, active:true },
  { id:"3", requirementDefinitionId:"DRAINAGE", condition:{ field:"nearWaterOrDrainage", op:"eq", value:true } as const, active:true },
  { id:"4", requirementDefinitionId:"FAAN", condition:{ field:"nearAirport", op:"eq", value:true } as const, active:false },
];
describe("requirements engine", () => {
  it("always includes unconditional requirements", () => expect(applicableRequirementIds(rules, { ...base })).toEqual(["SURVEY"]));
  it("adds structural above 3 floors", () => expect(applicableRequirementIds(rules, { ...base, floors:6 })).toContain("STRUCTURAL"));
  it("adds drainage near water", () => expect(applicableRequirementIds(rules, { ...base, nearWaterOrDrainage:true })).toContain("DRAINAGE"));
  it("ignores inactive rules", () => expect(applicableRequirementIds(rules, { ...base, nearAirport:true })).not.toContain("FAAN"));
});
