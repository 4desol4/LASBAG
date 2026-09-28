import { z } from "zod";

export const Role = { APPLICANT:"APPLICANT", PROFESSIONAL:"PROFESSIONAL", MDA_OFFICER:"MDA_OFFICER", ADMIN:"ADMIN", SUPER_ADMIN:"SUPER_ADMIN" } as const;
export const ApplicationStatus = { DRAFT:"DRAFT", SUBMITTED:"SUBMITTED", IN_REVIEW:"IN_REVIEW", ACTION_REQUIRED:"ACTION_REQUIRED", RETURNED:"RETURNED", APPROVED:"APPROVED", REJECTED:"REJECTED", COMPLETED:"COMPLETED", CANCELLED:"CANCELLED" } as const;
export const RequirementStatus = { NOT_REQUIRED:"NOT_REQUIRED", REQUIRED:"REQUIRED", SUBMITTED:"SUBMITTED", UNDER_REVIEW:"UNDER_REVIEW", VERIFIED:"VERIFIED", ACTION_NEEDED:"ACTION_NEEDED", REJECTED:"REJECTED", EXPIRED:"EXPIRED" } as const;
export const TaskStatus = { QUEUED:"QUEUED", IN_PROGRESS:"IN_PROGRESS", WAITING:"WAITING", COMPLETED:"COMPLETED", OVERDUE:"OVERDUE", ESCALATED:"ESCALATED" } as const;
export const DocumentStatus = { UPLOADED:"UPLOADED", UNDER_REVIEW:"UNDER_REVIEW", VERIFIED:"VERIFIED", REJECTED:"REJECTED", EXPIRED:"EXPIRED" } as const;

/** The seven lifecycle stages, in order. */
export const STAGES = [
  { order:1, key:"REQUIREMENTS", label:"Requirements" },
  { order:2, key:"SUBMISSION", label:"Submission" },
  { order:3, key:"CLEARANCES", label:"Clearances" },
  { order:4, key:"PLANNING_PERMIT", label:"Planning Permit" },
  { order:5, key:"AUTHORIZATION", label:"Authorization to Commence" },
  { order:6, key:"INSPECTIONS", label:"Inspections" },
  { order:7, key:"COMPLETION", label:"Completion / Certification" },
] as const;
export type StageKey = (typeof STAGES)[number]["key"];

/** Project answers collected by the LASBAG assistant. Government structure is never asked. */
export const projectAnswersSchema = z.object({
  developmentType: z.enum(["RESIDENTIAL","COMMERCIAL","INDUSTRIAL","INSTITUTIONAL","MIXED_USE","OTHER"]),
  location: z.string().min(2),
  proposedUse: z.string().optional(),
  floors: z.number().int().min(1).max(200),
  isNewDevelopment: z.boolean(),
  nearWaterOrDrainage: z.boolean().default(false),
  nearAirport: z.boolean().default(false),
});
export type ProjectAnswers = z.infer<typeof projectAnswersSchema>;

export const apiOk = <T>(data: T, message = "OK") => ({ success:true as const, data, message, error:null });
export const apiFail = (error: string, message = "Request failed") => ({ success:false as const, data:null, message, error });
