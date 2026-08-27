import { apiRequest } from "@/lib/apiClient";
import { getStoredToken } from "@/lib/auth/api";
import { ChatMessage, DocumentFieldValues, JsonValue } from "./types";

export interface DocumentChatResponse {
  reply: string;
  documentType: string | null;
  fields: DocumentFieldValues | null;
}

export function sendDocumentChatMessage(
  messages: ChatMessage[],
  documentType: string | null,
): Promise<DocumentChatResponse> {
  const token = getStoredToken();
  return apiRequest<DocumentChatResponse>("/api/documents/chat", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify({ messages, documentType }),
  });
}

// Applies the AI's current understanding of the document fields on top of the
// existing form state. Each turn's `update` reflects the model's complete
// belief state (not just what changed), so null means "still unknown" and is
// never merged in — the existing value (including any UI-only value the
// backend never sends, like a party's signatureDataUrl) is preserved. A
// non-null array (e.g. PSA's list of SOWs) replaces the array wholesale,
// since the model resends every previously-known item each turn, not just
// the one that changed.
export function mergeDocumentFields(current: JsonValue, update: JsonValue): JsonValue {
  if (update === null || update === undefined) return current;
  if (Array.isArray(update)) return update;
  if (typeof update === "object") {
    const currentObj = typeof current === "object" && current !== null && !Array.isArray(current) ? current : {};
    const merged: Record<string, JsonValue> = { ...currentObj };
    for (const key of Object.keys(update)) {
      merged[key] = mergeDocumentFields(currentObj[key] ?? null, update[key]);
    }
    return merged;
  }
  return update;
}
