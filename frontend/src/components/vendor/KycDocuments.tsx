"use client";

import { useRef, useState } from "react";
import { ApiError, uploadKycDocument } from "@/lib/api";

export type KycDocType = "government_id" | "cac_certificate";

export interface KycDocState {
  government_id: boolean;
  cac_certificate: boolean;
}

const DOCS: { key: KycDocType; title: string; text: string; required: boolean }[] = [
  {
    key: "government_id",
    title: "Government ID",
    text: "NIN slip, driver's license, voter's card or international passport.",
    required: true,
  },
  {
    key: "cac_certificate",
    title: "CAC certificate",
    text: "Business registration certificate. Optional for individuals.",
    required: false,
  },
];

const MAX_BYTES = 10 * 1024 * 1024;

export function KycDocumentUploader({
  businessId,
  initial,
  onChange,
}: {
  businessId: string;
  initial: KycDocState;
  onChange: (state: KycDocState) => void;
}) {
  const [done, setDone] = useState<KycDocState>(initial);
  const [uploading, setUploading] = useState<KycDocType | null>(null);
  const [error, setError] = useState("");
  const inputs = useRef<Record<KycDocType, HTMLInputElement | null>>({
    government_id: null,
    cac_certificate: null,
  });

  async function upload(docType: KycDocType, file: File) {
    setError("");
    if (file.size > MAX_BYTES) {
      setError("That file is larger than 10MB. Choose a smaller file or photo.");
      return;
    }
    setUploading(docType);
    try {
      await uploadKycDocument(businessId, docType, file);
      const next = { ...done, [docType]: true };
      setDone(next);
      onChange(next);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Upload failed. Check your connection and try again."
      );
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div role="alert" className="rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-800">
          {error}
        </div>
      )}
      {DOCS.map((doc) => {
        const isDone = done[doc.key];
        const isBusy = uploading === doc.key;
        return (
          <div key={doc.key} className="rounded-xl border border-stone-200 p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900">
                  {doc.title}{" "}
                  <span className={`text-xs font-medium ${doc.required ? "text-stone-500" : "text-teal-800"}`}>
                    {doc.required ? "· Required" : "· Optional"}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-stone-500">{doc.text}</p>
              </div>
              {isDone && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 shrink-0">
                  <i className="fa fa-check-circle" aria-hidden="true" /> Uploaded
                </span>
              )}
            </div>
            <input
              ref={(el) => {
                inputs.current[doc.key] = el;
              }}
              type="file"
              accept="image/*,.pdf"
              className="sr-only"
              aria-label={`Upload ${doc.title}`}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(doc.key, file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={isBusy}
              onClick={() => inputs.current[doc.key]?.click()}
              className="mt-2.5 inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-900 hover:bg-stone-100 min-h-[44px] disabled:opacity-50"
            >
              {isBusy ? (
                <>
                  <i className="fa fa-spinner fa-spin" aria-hidden="true" /> Uploading…
                </>
              ) : (
                <>
                  <i className="fa fa-upload" aria-hidden="true" /> {isDone ? "Replace file" : "Choose file"}
                </>
              )}
            </button>
          </div>
        );
      })}
      <p className="text-xs text-stone-500">Photos or PDF, up to 10MB. Stored privately, visible only to verification reviewers.</p>
    </div>
  );
}
