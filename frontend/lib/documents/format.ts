import { DocumentFieldValues } from "./types";

export function formatDisplayDate(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null;
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

function pluralYears(years: number): string {
  const n = years > 0 ? years : 1;
  return `${n} year${n === 1 ? "" : "s"}`;
}

// A handful of fields render as a composed phrase over sibling fields rather
// than their raw value (e.g. NDA's "mndaTerm" enum + "mndaTermYears" number
// -> "2 year(s) from the Effective Date"). Keyed by "slug.fieldKey".
export const SPECIAL_RESOLVERS: Record<string, (fields: DocumentFieldValues) => string | null> = {
  "mutual_nda.mndaTerm": (fields) => {
    if (fields.mndaTerm === "open") return "the date this MNDA is terminated in accordance with its terms";
    if (fields.mndaTerm === "fixed" && fields.mndaTermYears) {
      return `${pluralYears(Number(fields.mndaTermYears))} from the Effective Date`;
    }
    return null;
  },
  "mutual_nda.termOfConfidentiality": (fields) => {
    if (fields.termOfConfidentiality === "open") return "in perpetuity";
    if (fields.termOfConfidentiality === "fixed" && fields.termOfConfidentialityYears) {
      return `${pluralYears(Number(fields.termOfConfidentialityYears))} from the Effective Date`;
    }
    return null;
  },
};

const ENUM_LABELS: Record<string, string> = {
  controller: "Controller",
  processor: "Processor",
  company: "Company",
  partner: "Partner",
  neither: "Neither party",
};

export function formatEnumValue(value: string | null | undefined): string | null {
  if (!value) return null;
  return ENUM_LABELS[value] ?? value;
}

export function partyDisplayValue(party: DocumentFieldValues | null | undefined): string | null {
  if (!party) return null;
  const company = typeof party.company === "string" ? party.company.trim() : "";
  const printName = typeof party.printName === "string" ? party.printName.trim() : "";
  return company || printName || null;
}
