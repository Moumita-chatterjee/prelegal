"use client";

import { NdaFormData, PartyInfo } from "@/lib/nda/types";
import SignaturePad from "./SignaturePad";

interface SignatureStepProps {
  data: NdaFormData;
  onChange: (data: NdaFormData) => void;
}

export default function SignatureStep({ data, onChange }: SignatureStepProps) {
  const setParty = (key: "partyOne" | "partyTwo", party: PartyInfo) => onChange({ ...data, [key]: party });

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-800">Signatures</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SignatureField
          label={data.partyOne.printName || "Party 1"}
          party={data.partyOne}
          onChange={(party) => setParty("partyOne", party)}
        />
        <SignatureField
          label={data.partyTwo.printName || "Party 2"}
          party={data.partyTwo}
          onChange={(party) => setParty("partyTwo", party)}
        />
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
  party: PartyInfo;
  onChange: (party: PartyInfo) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      <SignaturePad
        value={party.signatureDataUrl}
        onChange={(signatureDataUrl) =>
          onChange({
            ...party,
            signatureDataUrl,
            // Stamp today's date when a party signs; clear it if they clear their signature.
            date: signatureDataUrl ? new Date().toISOString().slice(0, 10) : "",
          })
        }
      />
    </div>
  );
}
