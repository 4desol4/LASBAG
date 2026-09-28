import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
export interface Requirement { id: string; status: string; statusReason: string | null; sla: { dueTime: string; state: string; secondsLeft: number } | null;
  definition: { name: string; stage: string; documentType: string | null; agency: { code: string; name: string } }; documents: { id: string; versions: { version: number; status: string; originalName: string }[] }[] }
export interface Task { id: string; status: string; stage: string; agency: { code: string; name: string }; sla: { dueTime: string; state: string; secondsLeft: number } | null }
export interface AppEvent { id: string; type: string; description: string; createdAt: string }
export interface ApplicationDetail { id: string; reference: string; status: string; progress: number; currentStage: string; submittedAt: string | null; completedAt: string | null;
  project: { title: string; siteAddress: string; developmentType: string; answers: Record<string, unknown> } | null;
  requirements: Requirement[]; tasks: Task[]; events: AppEvent[];
  journey: { progress: number; currentStage: string | null; stages: { key: string; label: string; state: "COMPLETED" | "IN_PROGRESS" | "PENDING" }[] };
  nextAction: null | { kind: "CONTINUE" | "UPLOAD" | "WAIT"; requirementId?: string; title: string; reason?: string | null; dueTime?: string | null; cta: string } }
export interface ApplicationBrief { id: string; reference: string; status: string; progress: number; currentStage: string; updatedAt: string; project: { title: string; siteAddress: string; developmentType: string } | null }
export interface ChecklistItem { id: string; name: string; stage: string; mandatory: boolean }

export const useApplications = (params: { pageSize?: number; q?: string } = {}) =>
  useQuery({ queryKey: ["applications", params], queryFn: () => api.get<{ items: ApplicationBrief[]; total: number }>(`/applications?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}`) });
export const useApplication = (id?: string) => useQuery({ queryKey: ["application", id], enabled: !!id, queryFn: () => api.get<ApplicationDetail>(`/applications/${id}`) });
export const useChecklist = (answers: Record<string, unknown>) =>
  useQuery({ queryKey: ["checklist", answers], enabled: !!answers.developmentType, placeholderData: (p) => p, queryFn: () => api.post<ChecklistItem[]>("/requirements/evaluate", answers) });
export function useAppMutations(id?: string) {
  const qc = useQueryClient(); const refresh = () => { qc.invalidateQueries({ queryKey: ["application"] }); qc.invalidateQueries({ queryKey: ["applications"] }); qc.invalidateQueries({ queryKey: ["documents"] }); qc.invalidateQueries({ queryKey: ["notifications"] }); };
  return {
    upload: useMutation({ mutationFn: ({ file, documentType, requirementId, onProgress }: { file: File; documentType: string; requirementId?: string; onProgress?: (n: number) => void }) => {
      const f = new FormData(); f.append("documentType", documentType); if (requirementId) f.append("requirementId", requirementId); f.append("file", file); return api.upload(`/applications/${id}/documents`, f, onProgress); }, onSuccess: refresh }),
    submit: useMutation({ mutationFn: () => api.post(`/applications/${id}/submit`), onSuccess: refresh }),
  };
}
