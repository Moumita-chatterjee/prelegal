"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DocumentChat, { DocumentChatTurn } from "@/components/documents/DocumentChat";
import DocumentPreview from "@/components/documents/DocumentPreview";
import SignatureStep from "@/components/documents/SignatureStep";
import DownloadButton from "@/components/documents/DownloadButton";
import RequireAuth from "@/components/auth/RequireAuth";
import { mergeDocumentFields } from "@/lib/documents/chat";
import { createDocument, getDocument, updateDocument } from "@/lib/documents/api";
import { RAW_TEMPLATES } from "@/lib/documents/generated";
import { buildRenderedDocument, createEmptyFieldValues } from "@/lib/documents/render";
import { DOCUMENT_CONFIG_BY_SLUG } from "@/lib/documents/registry";
import { ChatMessage, DocumentFieldValues } from "@/lib/documents/types";

function updateIdInUrl(id: number | null) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (id) {
    url.searchParams.set("id", String(id));
  } else {
    url.searchParams.delete("id");
  }
  window.history.replaceState(null, "", url.toString());
}

export default function Home() {
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [values, setValues] = useState<DocumentFieldValues>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [isResuming, setIsResuming] = useState(() => {
    if (typeof window === "undefined") return false;
    const idParam = new URLSearchParams(window.location.search).get("id");
    return idParam !== null && Number.isFinite(Number(idParam));
  });
  const [saveError, setSaveError] = useState<string | null>(null);

  const documentIdRef = useRef<number | null>(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    documentIdRef.current = documentId;
  }, [documentId]);

  useEffect(() => {
    const idParam = new URLSearchParams(window.location.search).get("id");
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id)) return;
    getDocument(id)
      .then((doc) => {
        setDocumentId(doc.id);
        setDocumentType(doc.documentType);
        setValues(doc.fields);
        setMessages(doc.messages);
      })
      .catch(() => {
        updateIdInUrl(null);
      })
      .finally(() => setIsResuming(false));
  }, []);

  const config = documentType ? DOCUMENT_CONFIG_BY_SLUG[documentType] : null;

  const persistDocument = useCallback(
    async (type: string, currentMessages: ChatMessage[], currentValues: DocumentFieldValues) => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      try {
        const docConfig = DOCUMENT_CONFIG_BY_SLUG[type];
        const payload = {
          documentType: type,
          title: docConfig?.displayName ?? type,
          messages: currentMessages,
          fields: currentValues,
        };
        if (documentIdRef.current) {
          await updateDocument(documentIdRef.current, payload);
        } else {
          const saved = await createDocument(payload);
          documentIdRef.current = saved.id;
          setDocumentId(saved.id);
          updateIdInUrl(saved.id);
        }
        setSaveError(null);
      } catch {
        setSaveError("Couldn't save your progress. Changes may be lost if you leave this page.");
      } finally {
        isSavingRef.current = false;
      }
    },
    [],
  );

  const handleTurnComplete = ({ documentType: resolvedType, fields, messages: newMessages }: DocumentChatTurn) => {
    setMessages(newMessages);

    let nextType = documentType;
    let nextValues = values;

    if (resolvedType && resolvedType !== documentType) {
      nextType = resolvedType;
      const resolvedConfig = DOCUMENT_CONFIG_BY_SLUG[resolvedType];
      if (resolvedConfig) {
        nextValues = { ...createEmptyFieldValues(resolvedConfig), ...values };
      }
      setDocumentType(nextType);
    }

    if (fields) {
      nextValues = mergeDocumentFields(nextValues, fields) as DocumentFieldValues;
    }
    if (nextValues !== values) {
      setValues(nextValues);
    }

    if (nextType) {
      void persistDocument(nextType, newMessages, nextValues);
    }
  };

  const handleValuesChange = (next: DocumentFieldValues) => {
    setValues(next);
    if (documentType) {
      void persistDocument(documentType, messages, next);
    }
  };

  const handleNewDocument = () => {
    documentIdRef.current = null;
    setDocumentId(null);
    setDocumentType(null);
    setValues({});
    setMessages([]);
    setSaveError(null);
    updateIdInUrl(null);
  };

  const renderedDocument = useMemo(() => {
    if (!config) return null;
    return buildRenderedDocument(config, RAW_TEMPLATES[config.templateFilename], values);
  }, [config, values]);

  if (isResuming) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
          Loading your document...
        </div>
      </RequireAuth>
    );
  }

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
              {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            </div>
            <div className="flex items-center gap-3">
              {documentType && (
                <button
                  type="button"
                  onClick={handleNewDocument}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  New document
                </button>
              )}
              {renderedDocument && <DownloadButton document={renderedDocument} />}
            </div>
          </div>
        </header>

        <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-2">
          <div className="space-y-6">
            <DocumentChat
              key={documentId ?? "new"}
              documentType={documentType}
              initialMessages={messages.length > 0 ? messages : undefined}
              onTurnComplete={handleTurnComplete}
            />
            {config && <SignatureStep config={config} values={values} onChange={handleValuesChange} />}
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
