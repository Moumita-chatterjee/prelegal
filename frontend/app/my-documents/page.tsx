"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/auth/RequireAuth";
import { deleteDocument, listDocuments, SavedDocumentSummary } from "@/lib/documents/api";
import { DOCUMENT_CONFIG_BY_SLUG } from "@/lib/documents/registry";

function formatUpdatedAt(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function MyDocumentsPage() {
  const [documents, setDocuments] = useState<SavedDocumentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    listDocuments()
      .then(setDocuments)
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load your documents"));
  }, []);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteDocument(id);
      setDocuments((current) => current?.filter((doc) => doc.id !== id) ?? current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete that document");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-lg font-semibold text-[#032147]">My documents</h1>
              <p className="text-sm text-slate-500">Resume a document in progress or start a new one.</p>
            </div>
            <Link
              href="/"
              className="rounded-md bg-[#753991] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f2e75]"
            >
              New document
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-6 py-6">
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          {documents === null ? (
            <p className="text-sm text-slate-500">Loading your documents...</p>
          ) : documents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
              You don&apos;t have any documents yet. Start a new one to see it here.
            </div>
          ) : (
            <ul className="space-y-3">
              {documents.map((doc) => {
                const displayName = DOCUMENT_CONFIG_BY_SLUG[doc.documentType]?.displayName ?? doc.documentType;
                return (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{doc.title || displayName}</p>
                      <p className="text-xs text-[#888888]">
                        {displayName} · Updated {formatUpdatedAt(doc.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Link href={`/?id=${doc.id}`} className="text-sm font-medium text-[#209dd7] hover:underline">
                        Resume
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                        className="text-sm text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === doc.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}
