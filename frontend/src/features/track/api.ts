import { api } from "../../lib/api";
export interface PublicTrack { reference: string; status: string; progress: number; currentStage: string | null; updatedAt: string; stages: { key: string; label: string; state: "COMPLETED" | "IN_PROGRESS" | "PENDING" }[] }
export const trackReference = (ref: string) => api.get<PublicTrack>(`/public/track/${encodeURIComponent(ref.trim())}`);
