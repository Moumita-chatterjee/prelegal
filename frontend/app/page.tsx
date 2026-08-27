"use client";

import { useState } from "react";
import NdaChat from "@/components/nda/NdaChat";
import NdaPreview from "@/components/nda/NdaPreview";
import SignatureStep from "@/components/nda/SignatureStep";
import DownloadButton from "@/components/nda/DownloadButton";
import RequireAuth from "@/components/auth/RequireAuth";
import { mergeNdaFields } from "@/lib/nda/chat";
import { defaultNdaFormData } from "@/lib/nda/types";

export default function Home() {
  const [data, setData] = useState(defaultNdaFormData);

  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Mutual NDA Creator</h1>
              <p className="text-sm text-slate-500">
                Chat with the assistant below and watch your Mutual Non-Disclosure Agreement come together.
              </p>
            </div>
            <DownloadButton data={data} />
          </div>
        </header>

        <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-2">
          <div className="space-y-6">
            <NdaChat onFieldsUpdate={(fields) => setData((current) => mergeNdaFields(current, fields))} />
            <SignatureStep data={data} onChange={setData} />
          </div>
          <div className="lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
            <NdaPreview data={data} />
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
