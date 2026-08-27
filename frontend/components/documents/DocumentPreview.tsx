"use client";

import { Fragment, ReactNode } from "react";
import { formatDisplayDate } from "@/lib/documents/format";
import { computeSectionNumbers, InlineRun, RenderedDocument } from "@/lib/documents/render";
import { DocumentFieldValues } from "@/lib/documents/types";

interface DocumentPreviewProps {
  document: RenderedDocument;
}

export default function DocumentPreview({ document }: DocumentPreviewProps) {
  const sectionNumbers = computeSectionNumbers(document.body);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm text-slate-800">
      <h1 className="text-xl font-bold text-slate-900 text-center">{document.title}</h1>

      {document.summaryRows.length > 0 && (
        <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
          {document.summaryRows.map((row) => (
            <div key={row.label}>
              <span className="font-semibold text-slate-900">{row.label}: </span>
              <span className="bg-amber-50 px-1 rounded-sm">{row.value}</span>
            </div>
          ))}
        </section>
      )}

      {document.signatures.length > 0 && (
        <section
          className={`mt-8 grid gap-6 border-t border-slate-200 pt-6 ${
            document.signatures.length === 2 ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          {document.signatures.map((sig) => (
            <SignatureBlock key={sig.label} label={sig.label} party={sig.party} />
          ))}
        </section>
      )}

      {document.appendices.map((appendix) => (
        <section key={appendix.title} className="mt-8 border-t border-slate-200 pt-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900">{appendix.title}</h2>
          {appendix.items.length === 0 ? (
            <p className="text-sm text-slate-400 italic">None yet</p>
          ) : (
            appendix.items.map((item, index) => (
              <div key={index} className="rounded-md border border-slate-100 bg-slate-50 p-3 text-sm space-y-1">
                {item.map((field) => (
                  <div key={field.label}>
                    <span className="font-semibold text-slate-900">{field.label}: </span>
                    <span>{field.value || <span className="text-slate-400 italic">[{field.label}]</span>}</span>
                  </div>
                ))}
              </div>
            ))
          )}
        </section>
      ))}

      <section className="mt-8 border-t border-slate-200 pt-6 space-y-3 text-sm leading-relaxed">
        {document.body.map((node, index) => {
          if (node.type === "heading") {
            return (
              <h2 key={index} className="text-base font-bold text-slate-900 pt-2">
                {sectionNumbers[index]}. {renderRuns(node.runs)}
              </h2>
            );
          }
          return (
            <p key={index} style={{ marginLeft: `${(node.depth - 1) * 1.25}rem` }}>
              <span className="font-medium">{node.marker} </span>
              {renderRuns(node.runs)}
            </p>
          );
        })}
      </section>
    </div>
  );
}

function renderRuns(runs: InlineRun[]): ReactNode {
  return runs.map((run, index) => {
    if (run.type === "bold") {
      return <strong key={index}>{run.text}</strong>;
    }
    if (run.type === "var") {
      return (
        <span key={index} className="bg-amber-50 px-0.5 rounded-sm">
          {run.text}
        </span>
      );
    }
    if (run.type === "placeholder") {
      return (
        <span key={index} className="text-slate-400 italic">
          {run.text}
        </span>
      );
    }
    return <Fragment key={index}>{run.text}</Fragment>;
  });
}

function SignatureBlock({ label, party }: { label: string; party: DocumentFieldValues | null }) {
  const printName = (party?.printName as string) || "";
  const title = (party?.title as string) || "";
  const company = (party?.company as string) || "";
  const noticeAddress = (party?.noticeAddress as string) || "";
  const date = (party?.date as string) || "";
  const signatureDataUrl = (party?.signatureDataUrl as string | null) || null;

  return (
    <div className="space-y-1 text-sm">
      <h3 className="font-semibold text-slate-900">{label}</h3>
      {signatureDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={signatureDataUrl} alt={`${label} signature`} className="h-14 object-contain" />
      ) : (
        <div className="h-14 border-b border-slate-300" />
      )}
      <p>{printName || <span className="text-slate-400">Print Name</span>}</p>
      <p className="text-slate-600">
        {title || <span className="text-slate-400">Title</span>}
        {" · "}
        {company || <span className="text-slate-400">Company</span>}
      </p>
      <p className="text-slate-600">{noticeAddress || <span className="text-slate-400">Notice Address</span>}</p>
      <p className="text-slate-600">
        {date ? formatDisplayDate(date) : <span className="text-slate-400">Date</span>}
      </p>
    </div>
  );
}
