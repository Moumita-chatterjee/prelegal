"use client";

import { ReactNode } from "react";
import { NdaFormData, PartyInfo } from "@/lib/nda/types";
import {
  buildCoverPageFields,
  formatDisplayDate,
  mndaTermText,
  termOfConfidentialityText,
} from "@/lib/nda/format";
import { STANDARD_TERMS, STANDARD_TERMS_ATTRIBUTION, STANDARD_TERMS_TITLE } from "@/lib/nda/standardTerms";

interface NdaPreviewProps {
  data: NdaFormData;
}

export default function NdaPreview({ data }: NdaPreviewProps) {
  const fields = buildCoverPageFields(data);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm text-slate-800">
      <h1 className="text-xl font-bold text-slate-900 text-center">
        Mutual Non-Disclosure Agreement
      </h1>

      <section className="mt-6 space-y-4 text-sm">
        <Field label="Purpose" hint="How Confidential Information may be used">
          {fields.purpose}
        </Field>
        <Field label="Effective Date">{formatDisplayDate(data.effectiveDate)}</Field>
        <Field label="MNDA Term" hint="The length of this MNDA">
          {mndaTermText(data)}
        </Field>
        <Field label="Term of Confidentiality" hint="How long Confidential Information is protected">
          {termOfConfidentialityText(data)}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Governing Law">{fields.governingLaw}</Field>
          <Field label="Jurisdiction">{fields.jurisdiction}</Field>
        </div>
        {data.modifications.trim() && (
          <Field label="MNDA Modifications">{data.modifications}</Field>
        )}
      </section>

      <section className="mt-8 grid grid-cols-2 gap-6 border-t border-slate-200 pt-6">
        <SignatureBlock label="Party 1" party={data.partyOne} />
        <SignatureBlock label="Party 2" party={data.partyTwo} />
      </section>

      <section className="mt-8 border-t border-slate-200 pt-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">{STANDARD_TERMS_TITLE}</h2>
        <ol className="space-y-3 text-sm leading-relaxed list-decimal list-outside pl-5">
          {STANDARD_TERMS.map((section) => (
            <li key={section.heading}>
              <span className="font-semibold">{section.heading}. </span>
              {section.body}
            </li>
          ))}
        </ol>
        <p className="text-xs text-slate-500 pt-2">{STANDARD_TERMS_ATTRIBUTION}</p>
      </section>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="font-semibold text-slate-900">{label}:</span>
        <span className="bg-amber-50 px-1 rounded-sm">{children}</span>
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function SignatureBlock({ label, party }: { label: string; party: PartyInfo }) {
  return (
    <div className="space-y-1 text-sm">
      <h3 className="font-semibold text-slate-900">{label}</h3>
      {party.signatureDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={party.signatureDataUrl}
          alt={`${label} signature`}
          className="h-14 object-contain"
        />
      ) : (
        <div className="h-14 border-b border-slate-300" />
      )}
      <p>{party.printName || <span className="text-slate-400">Print Name</span>}</p>
      <p className="text-slate-600">
        {party.title || <span className="text-slate-400">Title</span>}
        {" · "}
        {party.company || <span className="text-slate-400">Company</span>}
      </p>
      <p className="text-slate-600">
        {party.noticeAddress || <span className="text-slate-400">Notice Address</span>}
      </p>
      <p className="text-slate-600">
        {party.date ? formatDisplayDate(party.date) : <span className="text-slate-400">Date</span>}
      </p>
    </div>
  );
}
