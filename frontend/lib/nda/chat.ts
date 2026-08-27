import { apiRequest } from "@/lib/apiClient";
import { getStoredToken } from "@/lib/auth/api";
import { NdaFormData, PartyInfo } from "./types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type PartyFieldsUpdate = Partial<Record<keyof Omit<PartyInfo, "signatureDataUrl">, string | null>>;

export type NdaFieldsUpdate = Partial<{
  [K in keyof Omit<NdaFormData, "partyOne" | "partyTwo">]: NdaFormData[K] | null;
}> & {
  partyOne?: PartyFieldsUpdate | null;
  partyTwo?: PartyFieldsUpdate | null;
};

export interface NdaChatResponse {
  reply: string;
  fields: NdaFieldsUpdate;
}

export function sendNdaChatMessage(messages: ChatMessage[]): Promise<NdaChatResponse> {
  const token = getStoredToken();
  return apiRequest<NdaChatResponse>("/api/nda/chat", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify({ messages }),
  });
}

function mergeParty(current: PartyInfo, update: PartyFieldsUpdate | null | undefined): PartyInfo {
  if (!update) return current;
  const merged = { ...current };
  for (const key of Object.keys(update) as (keyof PartyFieldsUpdate)[]) {
    const value = update[key];
    if (value !== null && value !== undefined) {
      merged[key] = value;
    }
  }
  return merged;
}

// Applies the AI's current understanding of the NDA fields on top of the existing
// form data. Each turn's `fields` reflects the model's complete belief state (not
// just what changed), so we only overwrite values it has actually established
// (non-null) and otherwise keep whatever the user/chat already had.
export function mergeNdaFields(current: NdaFormData, update: NdaFieldsUpdate): NdaFormData {
  const merged = { ...current };
  for (const key of Object.keys(update) as (keyof NdaFieldsUpdate)[]) {
    if (key === "partyOne" || key === "partyTwo") continue;
    const value = update[key];
    if (value !== null && value !== undefined) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }
  merged.partyOne = mergeParty(current.partyOne, update.partyOne);
  merged.partyTwo = mergeParty(current.partyTwo, update.partyTwo);
  return merged;
}
