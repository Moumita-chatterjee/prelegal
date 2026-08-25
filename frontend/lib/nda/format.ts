import { NdaFormData } from "./types";

export function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return "[Effective Date]";
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function pluralYears(years: number): string {
  const n = years > 0 ? years : 1;
  return `${n} year${n === 1 ? "" : "s"}`;
}

export function mndaTermText(data: NdaFormData): string {
  return data.mndaTerm === "fixed"
    ? `${pluralYears(data.mndaTermYears)} from the Effective Date`
    : "the date this MNDA is terminated in accordance with its terms";
}

export function termOfConfidentialityText(data: NdaFormData): string {
  return data.termOfConfidentiality === "fixed"
    ? `${pluralYears(
        data.termOfConfidentialityYears,
      )} from the Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws`
    : "perpetuity";
}

export interface CoverPageFields {
  purpose: string;
  governingLaw: string;
  jurisdiction: string;
}

export function buildCoverPageFields(data: NdaFormData): CoverPageFields {
  return {
    purpose: data.purpose.trim() || "[Purpose]",
    governingLaw: data.governingLaw.trim() || "[Governing Law]",
    jurisdiction: data.jurisdiction.trim() || "[Jurisdiction]",
  };
}
