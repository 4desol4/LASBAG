import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
export interface ConversationBrief { id: string; subject: string; applicationId: string; reference: string; projectTitle: string | null; lastMessage: { body: string; createdAt: string; isSystem: boolean } | null; unread: number }
export interface Msg { id: string; body: string; isSystem: boolean; createdAt: string; mine: boolean; sender: string; senderRole: string | null }
export interface ConversationFull { id: string; subject: string; applicationId: string; reference: string; projectTitle: string | null; messages: Msg[] }
export const useConversations = () => useQuery({ queryKey: ["conversations"], refetchInterval: 60_000, queryFn: () => api.get<{ items: ConversationBrief[] }>("/conversations") });
export const useConversation = (id?: string) => useQuery({ queryKey: ["conversation", id], enabled: !!id, refetchInterval: 20_000, queryFn: () => api.get<ConversationFull>(`/conversations/${id}`) });
export function useSendMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: string) => api.post(`/conversations/${id}/messages`, { body }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["conversation", id] }); qc.invalidateQueries({ queryKey: ["conversations"] }); } });
}
