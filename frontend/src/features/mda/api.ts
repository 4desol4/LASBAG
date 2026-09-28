import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { ApplicationDetail } from "../applications/api";
export type Tab = "all" | "new" | "in_review" | "waiting" | "due_soon" | "overdue" | "completed";
export interface QueueItem { id: string; reference: string; status: string; currentStage: string; progress: number; projectTitle?: string; applicantName: string; sla: { state: string; secondsLeft: number } | null }
export interface Queue { items: QueueItem[]; total: number; counts: Record<Tab, number> }
export interface AuditRow { id: string; action: string; role: string | null; reason: string | null; previousStatus: string | null; newStatus: string | null; createdAt: string }
export type Review = ApplicationDetail & { history: AuditRow[]; applicant: { firstName: string; lastName: string; email: string } };
export const useQueue = (p: { tab: Tab; q: string; page: number }) =>
  useQuery({ queryKey: ["mda-queue", p], placeholderData: (x) => x, queryFn: () => api.get<Queue>(`/mda/applications?${new URLSearchParams({ tab: p.tab, q: p.q, page: String(p.page), pageSize: "10" })}`) });
export const useReview = (id: string) => useQuery({ queryKey: ["mda-review", id], queryFn: async () => { await api.post(`/mda/applications/${id}/start`); return api.get<Review>(`/mda/applications/${id}`); } });
export function useDecision(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ action, ...b }: { action: "approve" | "clarification" | "return" | "escalate"; reason: string; requirementId?: string }) => api.post(`/mda/applications/${id}/${action}`, b),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mda-review", id] }); qc.invalidateQueries({ queryKey: ["mda-queue"] }); } });
}
