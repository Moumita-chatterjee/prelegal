import { apiRequest } from "@/lib/apiClient";
import { getStoredToken } from "@/lib/auth/api";
import { ChatMessage, DocumentFieldValues } from "./types";

export interface SavedDocumentSummary {
  id: number;
  documentType: string;
  title: string | null;
  updatedAt: string;
}

export interface SavedDocument extends SavedDocumentSummary {
  messages: ChatMessage[];
  fields: DocumentFieldValues;
}

interface SaveDocumentPayload {
  documentType: string;
  title?: string | null;
  messages: ChatMessage[];
  fields: DocumentFieldValues;
}

function authHeaders(): HeadersInit | undefined {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export function listDocuments(): Promise<SavedDocumentSummary[]> {
  return apiRequest<SavedDocumentSummary[]>("/api/documents", { headers: authHeaders() });
}

export function getDocument(id: number): Promise<SavedDocument> {
  return apiRequest<SavedDocument>(`/api/documents/${id}`, { headers: authHeaders() });
}

export function createDocument(payload: SaveDocumentPayload): Promise<SavedDocument> {
  return apiRequest<SavedDocument>("/api/documents", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export function updateDocument(id: number, payload: SaveDocumentPayload): Promise<SavedDocument> {
  return apiRequest<SavedDocument>(`/api/documents/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export function deleteDocument(id: number): Promise<void> {
  return apiRequest<void>(`/api/documents/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}
