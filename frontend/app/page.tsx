"use client";

import { useMemo, useState } from "react";
import DocumentChat from "@/components/documents/DocumentChat";
import DocumentPreview from "@/components/documents/DocumentPreview";
import SignatureStep from "@/components/documents/SignatureStep";
import DownloadButton from "@/components/documents/DownloadButton";
import RequireAuth from "@/components/auth/RequireAuth";
import { mergeDocumentFields } from "@/lib/documents/chat";
import { RAW_TEMPLATES } from "@/lib/documents/generated";
import { buildRenderedDocument, createEmptyFieldValues } from "@/lib/documents/render";
import { DOCUMENT_CONFIG_BY_SLUG } from "@/lib/documents/registry";
import { DocumentFieldValues } from "@/lib/documents/types";

export default function Home() {
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [values, setValues] = useState<DocumentFieldValues>({});

  const config = documentType ? DOCUMENT_CONFIG_BY_SLUG[documentType] : null;

  const handleDocumentTypeResolved = (slug: string) => {
    setDocumentType(slug);
    const resolvedConfig = DOCUMENT_CONFIG_BY_SLUG[slug];
    if (resolvedConfig) {
      setValues((current) => ({ ...createEmptyFieldValues(resolvedConfig), ...current }));
    }
  };

  const handleFieldsUpdate = (update: DocumentFieldValues) => {
    setValues((current) => mergeDocumentFields(current, update) as DocumentFieldValues);
  };

  const renderedDocument = useMemo(() => {
    if (!config) return null;
    return buildRenderedDocument(config, RAW_TEMPLATES[config.templateFilename], values);
  }, [config, values]);

  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                {config ? config.displayName : "Legal Document Creator"}
              </h1>
              <p className="text-sm text-slate-500">
                {config
                  ? "Chat with the assistant below and watch your document come together."
                  : "Tell the assistant what you need — it'll figure out which document fits."}
              </p>
            </div>
            {renderedDocument && <DownloadButton document={renderedDocument} />}
          </div>
        </header>

        <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-2">
          <div className="space-y-6">
            <DocumentChat
              documentType={documentType}
              onDocumentTypeResolved={handleDocumentTypeResolved}
              onFieldsUpdate={handleFieldsUpdate}
            />
            {config && <SignatureStep config={config} values={values} onChange={setValues} />}
          </div>
          <div className="lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
            {renderedDocument ? (
              <DocumentPreview document={renderedDocument} />
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
                Your document preview will appear here once the assistant knows what you need.
              </div>
            )}
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
