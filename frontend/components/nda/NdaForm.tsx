"use client";

import { DurationTerm, NdaFormData } from "@/lib/nda/types";
import PartyFields from "./PartyFields";

interface NdaFormProps {
  data: NdaFormData;
  onChange: (data: NdaFormData) => void;
}

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
const labelClass = "block text-xs font-medium text-slate-600 mb-1";
const sectionClass = "space-y-3";
const sectionTitleClass = "text-sm font-semibold text-slate-800";

export default function NdaForm({ data, onChange }: NdaFormProps) {
  const set = <K extends keyof NdaFormData>(key: K, value: NdaFormData[K]) =>
    onChange({ ...data, [key]: value });

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Purpose</h2>
        <p className="text-xs text-slate-500">How Confidential Information may be used</p>
        <textarea
          className={inputClass}
          rows={2}
          value={data.purpose}
          onChange={(e) => set("purpose", e.target.value)}
        />
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Effective Date</h2>
        <input
          type="date"
          className={inputClass}
          value={data.effectiveDate}
          onChange={(e) => set("effectiveDate", e.target.value)}
        />
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>MNDA Term</h2>
        <p className="text-xs text-slate-500">The length of this MNDA</p>
        <DurationChoice
          value={data.mndaTerm}
          years={data.mndaTermYears}
          fixedLabel="Expires"
          openLabel="Continues until terminated in accordance with the terms of the MNDA."
          onValueChange={(v) => set("mndaTerm", v)}
          onYearsChange={(y) => set("mndaTermYears", y)}
        />
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Term of Confidentiality</h2>
        <p className="text-xs text-slate-500">How long Confidential Information is protected</p>
        <DurationChoice
          value={data.termOfConfidentiality}
          years={data.termOfConfidentialityYears}
          fixedLabel="Expires"
          openLabel="In perpetuity."
          onValueChange={(v) => set("termOfConfidentiality", v)}
          onYearsChange={(y) => set("termOfConfidentialityYears", y)}
        />
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Governing Law &amp; Jurisdiction</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Governing Law (state)</label>
            <input
              className={inputClass}
              value={data.governingLaw}
              onChange={(e) => set("governingLaw", e.target.value)}
              placeholder="Delaware"
            />
          </div>
          <div>
            <label className={labelClass}>Jurisdiction (city/county &amp; state)</label>
            <input
              className={inputClass}
              value={data.jurisdiction}
              onChange={(e) => set("jurisdiction", e.target.value)}
              placeholder="New Castle, DE"
            />
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>MNDA Modifications</h2>
        <p className="text-xs text-slate-500">List any modifications to the MNDA (optional)</p>
        <textarea
          className={inputClass}
          rows={2}
          value={data.modifications}
          onChange={(e) => set("modifications", e.target.value)}
        />
      </div>

      <PartyFields label="Party 1" party={data.partyOne} onChange={(p) => set("partyOne", p)} />
      <PartyFields label="Party 2" party={data.partyTwo} onChange={(p) => set("partyTwo", p)} />
    </form>
  );
}

interface DurationChoiceProps {
  value: DurationTerm;
  years: number;
  fixedLabel: string;
  openLabel: string;
  onValueChange: (value: DurationTerm) => void;
  onYearsChange: (years: number) => void;
}

function DurationChoice({
  value,
  years,
  fixedLabel,
  openLabel,
  onValueChange,
  onYearsChange,
}: DurationChoiceProps) {
  const name = `duration-${fixedLabel}-${openLabel}`.replace(/\s+/g, "-");
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="radio"
          name={name}
          checked={value === "fixed"}
          onChange={() => onValueChange("fixed")}
        />
        <span>{fixedLabel}</span>
        <input
          type="number"
          min={1}
          className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-100"
          value={years}
          disabled={value !== "fixed"}
          onChange={(e) => onYearsChange(Math.max(1, Number(e.target.value) || 1))}
        />
        <span>year(s) from Effective Date</span>
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="radio"
          name={name}
          checked={value === "open"}
          onChange={() => onValueChange("open")}
        />
        <span>{openLabel}</span>
      </label>
    </div>
  );
}
