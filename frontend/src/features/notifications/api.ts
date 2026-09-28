import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
export interface Notice { id: string; title: string; body: string; link: string | null; readAt: string | null; createdAt: string }
export interface NoticePage { items: Notice[]; total: number; unread: number; page: number; pageSize: number }
export const useNotifications = (p: { filter: "all" | "unread"; page: number }) =>
  useQuery({ queryKey: ["notifications", p], placeholderData: (x) => x, queryFn: () => api.get<NoticePage>(`/notifications?filter=${p.filter}&page=${p.page}&pageSize=15`) });
/** Cheap poll for the header badge. */
export const useUnread = () => useQuery({ queryKey: ["notifications", "badge"], refetchInterval: 60_000, queryFn: async () => (await api.get<NoticePage>("/notifications?pageSize=1")).unread });
export function useNoticeActions() {
  const qc = useQueryClient(), done = () => qc.invalidateQueries({ queryKey: ["notifications"] });
  return { read: useMutation({ mutationFn: (id: string) => api.post(`/notifications/${id}/read`), onSuccess: done }), readAll: useMutation({ mutationFn: () => api.post("/notifications/read-all"), onSuccess: done }) };
}
