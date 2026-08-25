"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { NdaFormData } from "@/lib/nda/types";
import NdaPdfDocument from "./NdaPdfDocument";

interface DownloadButtonProps {
  data: NdaFormData;
}

export default function DownloadButton({ data }: DownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await pdf(<NdaPdfDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const companySlug = (data.partyOne.company || "mutual-nda").replace(/[^a-z0-9]+/gi, "-");
      link.href = url;
      link.download = `${companySlug}-mutual-nda.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isGenerating}
      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isGenerating ? "Generating PDF..." : "Download PDF"}
    </button>
  );
}
