"use client";

import { useEffect, useRef } from "react";
import SignaturePadLib from "signature_pad";

interface SignaturePadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

export default function SignaturePad({ value, onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
    valueRef.current = value;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      if (valueRef.current) {
        padRef.current?.fromDataURL(valueRef.current);
      }
    };

    const pad = new SignaturePadLib(canvas, {
      backgroundColor: "rgb(255, 255, 255)",
      penColor: "rgb(15, 23, 42)",
    });
    padRef.current = pad;
    resize();

    const handleEndStroke = () => {
      onChangeRef.current(pad.isEmpty() ? null : pad.toDataURL("image/png"));
    };
    pad.addEventListener("endStroke", handleEndStroke);

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      pad.removeEventListener("endStroke", handleEndStroke);
      pad.off();
    };
  }, []);

  const handleClear = () => {
    padRef.current?.clear();
    onChange(null);
  };

  return (
    <div className="space-y-1">
      <canvas
        ref={canvasRef}
        className="h-28 w-full cursor-crosshair rounded-md border border-slate-300 bg-white touch-none"
      />
      <button
        type="button"
        onClick={handleClear}
        className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2"
      >
        Clear signature
      </button>
    </div>
  );
}
