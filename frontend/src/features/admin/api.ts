import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
export interface AdminStats { totals: { applications: number; averageProgress: number; completed: number; inProgress: number; needsApplicant: number; overdueSla: number };
  byStatus: { status: string; count: number }[]; byStage: { key: string; label: string; count: number }[]; weekly: { label: string; count: number }[];
  agencies: { code: string; name: string; waiting: number; overdue: number; completed: number }[] }
export const useAdminStats = () => useQuery({ queryKey: ["admin-stats"], queryFn: () => api.get<AdminStats>("/admin/stats") });
