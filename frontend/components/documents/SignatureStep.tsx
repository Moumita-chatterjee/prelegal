"use client";

import SignaturePad from "@/components/SignaturePad";
import { DocumentConfig, DocumentFieldValues } from "@/lib/documents/types";

interface SignatureStepProps {
  config: DocumentConfig;
  values: DocumentFieldValues;
  onChange: (values: DocumentFieldValues) => void;
}

export default function SignatureStep({ config, values, onChange }: SignatureStepProps) {
  const partyFields = config.fields.filter((field) => field.isParty);

  const setParty = (key: string, party: DocumentFieldValues) => onChange({ ...values, [key]: party });

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-800">Signatures</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {partyFields.map((field) => {
          const party = (values[field.key] as DocumentFieldValues) ?? {};
          return (
            <SignatureField
              key={field.key}
              label={(party.printName as string) || field.label}
              party={party}
              onChange={(next) => setParty(field.key, next)}
            />
          );
        })}
      </div>
    </div>
  );
}

function SignatureField({
  label,
  party,
  onChange,
}: {
  label: string;
  party: DocumentFieldValues;
  onChange: (party: DocumentFieldValues) => void;
}) {
  const signatureDataUrl = (party.signatureDataUrl as string | null) ?? null;

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      <SignaturePad
        value={signatureDataUrl}
        onChange={(dataUrl) =>
          onChange({
            ...party,
            signatureDataUrl: dataUrl,
            // Stamp today's date when a party signs; clear it if they clear their signature.
            date: dataUrl ? new Date().toISOString().slice(0, 10) : "",
          })
        }
      />
    </div>
  );
}
