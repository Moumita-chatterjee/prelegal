export type FieldKind = "text" | "long_text" | "date" | "integer" | "enum" | "group";

export interface FieldMeta {
  key: string;
  label: string;
  kind: FieldKind;
  linkNames?: string[];
  isParty?: boolean;
  repeat?: boolean;
  appendixTitle?: string;
  summarize?: boolean;
  fields?: FieldMeta[];
}

export interface DocumentConfig {
  slug: string;
  displayName: string;
  templateFilename: string;
  fields: FieldMeta[];
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type DocumentFieldValues = Record<string, JsonValue>;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
