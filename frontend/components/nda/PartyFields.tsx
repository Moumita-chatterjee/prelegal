"use client";

import { PartyInfo } from "@/lib/nda/types";
import SignaturePad from "./SignaturePad";

interface PartyFieldsProps {
  label: string;
  party: PartyInfo;
  onChange: (party: PartyInfo) => void;
}

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
const labelClass = "block text-xs font-medium text-slate-600 mb-1";

export default function PartyFields({ label, party, onChange }: PartyFieldsProps) {
  const set = <K extends keyof PartyInfo>(key: K, value: PartyInfo[K]) =>
    onChange({ ...party, [key]: value });

  return (
    <fieldset className="rounded-lg border border-slate-200 p-4 space-y-3">
      <legend className="px-1 text-sm font-semibold text-slate-800">{label}</legend>

      <div>
        <label className={labelClass}>Print Name</label>
        <input
          className={inputClass}
          value={party.printName}
          onChange={(e) => set("printName", e.target.value)}
          placeholder="Jane Doe"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Title</label>
          <input
            className={inputClass}
            value={party.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="CEO"
          />
        </div>
        <div>
          <label className={labelClass}>Company</label>
          <input
            className={inputClass}
            value={party.company}
            onChange={(e) => set("company", e.target.value)}
            placeholder="Acme, Inc."
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Notice Address (email or postal)</label>
        <input
          className={inputClass}
          value={party.noticeAddress}
          onChange={(e) => set("noticeAddress", e.target.value)}
          placeholder="legal@acme.com"
        />
      </div>

      <div>
        <label className={labelClass}>Date</label>
        <input
          type="date"
          className={inputClass}
          value={party.date}
          onChange={(e) => set("date", e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass}>Signature</label>
        <SignaturePad
          value={party.signatureDataUrl}
          onChange={(dataUrl) => set("signatureDataUrl", dataUrl)}
        />
      </div>
    </fieldset>
  );
}
