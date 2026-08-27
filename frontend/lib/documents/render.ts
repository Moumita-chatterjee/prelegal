import { formatDisplayDate, formatEnumValue, partyDisplayValue, SPECIAL_RESOLVERS } from "./format";
import { DocumentConfig, DocumentFieldValues, FieldMeta, JsonValue } from "./types";

export type InlineRun =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "var"; text: string }
  | { type: "placeholder"; text: string };

export type BodyNode =
  | { type: "heading"; marker: string; runs: InlineRun[] }
  | { type: "item"; depth: number; marker: string; runs: InlineRun[] };

export interface RenderedDocument {
  title: string;
  summaryRows: { label: string; value: string }[];
  body: BodyNode[];
  appendices: { title: string; items: { label: string; value: string }[][] }[];
  signatures: { label: string; party: DocumentFieldValues | null }[];
}

function resolveFieldDisplayValue(
  slug: string,
  field: FieldMeta,
  values: DocumentFieldValues,
): string | null {
  if (field.isParty) {
    return partyDisplayValue(values[field.key] as DocumentFieldValues | null);
  }
  if (field.kind === "enum") {
    const specialResolver = SPECIAL_RESOLVERS[`${slug}.${field.key}`];
    if (specialResolver) return specialResolver(values);
    return formatEnumValue(values[field.key] as string | null | undefined);
  }
  if (field.kind === "date") {
    return formatDisplayDate(values[field.key] as string | null | undefined);
  }
  const raw = values[field.key];
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (typeof raw === "number") return String(raw);
  return null;
}

interface VariableEntry {
  resolved: string | null;
}

function buildVariableMap(config: DocumentConfig, values: DocumentFieldValues): Map<string, VariableEntry> {
  const map = new Map<string, VariableEntry>();
  for (const field of config.fields) {
    if (field.repeat || !field.linkNames || field.linkNames.length === 0) continue;
    const resolved = resolveFieldDisplayValue(config.slug, field, values);
    for (const name of field.linkNames) {
      map.set(name, { resolved });
    }
  }
  return map;
}

function resolveVarRun(inner: string, variableMap: Map<string, VariableEntry>): InlineRun {
  const possessiveMatch = inner.match(/^(.*?)['’]s$/);
  const base = possessiveMatch ? possessiveMatch[1] : inner;
  const suffix = possessiveMatch ? "'s" : "";
  const entry = variableMap.get(base);
  if (!entry) return { type: "text", text: inner };
  if (entry.resolved) return { type: "var", text: entry.resolved + suffix };
  return { type: "placeholder", text: `[${base}]${suffix}` };
}

// Matches any <span ...>...</span> (attributes captured generically, since
// order/presence of class= and id= varies across templates — some spans have
// no class at all, e.g. bare numbering anchors like <span id="3.1"></span>),
// or **bold** markdown.
const INLINE_PATTERN = /<span([^>]*)>([\s\S]*?)<\/span>|\*\*([\s\S]*?)\*\*/g;
const CLASS_PATTERN = /class="([\w-]+)"/;

// Renders nested runs (e.g. a variable span embedded inside **bold** text) as
// plain resolved text, dropping their own styling — bold already carries the
// emphasis, and a doubly-nested React node isn't needed for a value that's
// just a few words.
function flattenToPlainText(text: string, variableMap: Map<string, VariableEntry>): string {
  return tokenizeInline(text, variableMap)
    .map((run) => run.text)
    .join("");
}

function tokenizeInline(text: string, variableMap: Map<string, VariableEntry>): InlineRun[] {
  const runs: InlineRun[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const pattern = new RegExp(INLINE_PATTERN);
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      const classMatch = CLASS_PATTERN.exec(match[1]);
      const className = classMatch ? classMatch[1] : null;
      const inner = match[2];
      if (className === "header_3") {
        runs.push({ type: "bold", text: flattenToPlainText(inner, variableMap) });
      } else if (className?.endsWith("_link")) {
        runs.push(resolveVarRun(inner, variableMap));
      } else {
        // A span with no recognized class (e.g. a bare numbering anchor like
        // <span id="3.1"></span>, or a structural span not meant for
        // substitution) — strip the wrapper and keep whatever's inside.
        runs.push(...tokenizeInline(inner, variableMap));
      }
    } else {
      runs.push({ type: "bold", text: flattenToPlainText(match[3], variableMap) });
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    runs.push({ type: "text", text: text.slice(lastIndex) });
  }
  return runs.filter((run) => run.text.length > 0);
}

const MARKER_PATTERN = /^([A-Za-z0-9]+\.)\s+(.*)$/;
const HEADING2_PATTERN = /^<span class="header_2"(?:\s+id="[^"]*")?>([\s\S]*?)<\/span>$/;

function parseBody(rawMarkdown: string, variableMap: Map<string, VariableEntry>): BodyNode[] {
  const nodes: BodyNode[] = [];
  for (const rawLine of rawMarkdown.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (!line.trim() || line.startsWith("# ")) continue;

    const indent = line.length - line.trimStart().length;
    const depth = Math.min(Math.floor(indent / 4), 3);
    const trimmed = line.trim();
    const markerMatch = MARKER_PATTERN.exec(trimmed);
    const marker = markerMatch ? markerMatch[1] : "";
    const rest = markerMatch ? markerMatch[2].trim() : trimmed;
    if (!rest) continue;

    const headingMatch = HEADING2_PATTERN.exec(rest);
    if (headingMatch) {
      nodes.push({ type: "heading", marker, runs: tokenizeInline(headingMatch[1], variableMap) });
    } else {
      nodes.push({ type: "item", depth, marker, runs: tokenizeInline(rest, variableMap) });
    }
  }
  return nodes;
}

function buildSummaryRows(config: DocumentConfig, values: DocumentFieldValues): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  for (const field of config.fields) {
    if (!field.summarize) continue;
    const resolved = resolveFieldDisplayValue(config.slug, field, values);
    rows.push({ label: field.label, value: resolved ?? `[${field.label}]` });
  }
  return rows;
}

function buildAppendices(
  config: DocumentConfig,
  values: DocumentFieldValues,
): { title: string; items: { label: string; value: string }[][] }[] {
  const appendices: { title: string; items: { label: string; value: string }[][] }[] = [];
  for (const field of config.fields) {
    if (!field.appendixTitle || !field.fields) continue;
    const rawItems = values[field.key];
    const items = Array.isArray(rawItems) ? (rawItems as DocumentFieldValues[]) : [];
    appendices.push({
      title: field.appendixTitle,
      items: items.map((item) =>
        field.fields!.map((sub) => ({
          label: sub.label,
          value: (item[sub.key] as string | null) ?? "",
        })),
      ),
    });
  }
  return appendices;
}

function buildSignatures(
  config: DocumentConfig,
  values: DocumentFieldValues,
): { label: string; party: DocumentFieldValues | null }[] {
  return config.fields
    .filter((field) => field.isParty)
    .map((field) => ({ label: field.label, party: (values[field.key] as DocumentFieldValues) ?? null }));
}

export function buildRenderedDocument(
  config: DocumentConfig,
  rawMarkdown: string,
  values: DocumentFieldValues,
): RenderedDocument {
  const variableMap = buildVariableMap(config, values);
  return {
    title: config.displayName,
    summaryRows: buildSummaryRows(config, values),
    body: parseBody(rawMarkdown, variableMap),
    appendices: buildAppendices(config, values),
    signatures: buildSignatures(config, values),
  };
}

// Parallel array to `body`: the 1-based section number for each heading node,
// or null for non-heading nodes. Precomputed once per render rather than
// mutated inline while mapping over `body`, since JSX render callbacks may
// run more than once per commit.
export function computeSectionNumbers(body: BodyNode[]): (number | null)[] {
  let count = 0;
  return body.map((node) => {
    if (node.type !== "heading") return null;
    count += 1;
    return count;
  });
}

export function createEmptyFieldValues(config: DocumentConfig): DocumentFieldValues {
  const values: DocumentFieldValues = {};
  for (const field of config.fields) {
    if (field.isParty) {
      values[field.key] = {
        printName: "",
        title: "",
        company: "",
        noticeAddress: "",
        date: "",
        signatureDataUrl: null as unknown as JsonValue,
      };
    } else if (field.repeat) {
      values[field.key] = [];
    }
  }
  return values;
}
