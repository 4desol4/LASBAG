import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
export interface LibraryDoc { id: string; documentType: string; applicationId: string; reference: string; projectTitle: string | null; requirementId: string | null; requirementName: string | null; requirementStatus: string | null; versionCount: number;
  latest: { id: string; version: number; originalName: string; mimeType: string; fileSize: number; status: string; rejectionReason: string | null; uploadedAt: string } }
export const useDocumentLibrary = () => useQuery({ queryKey: ["documents"], queryFn: () => api.get<{ items: LibraryDoc[] }>("/documents") });
