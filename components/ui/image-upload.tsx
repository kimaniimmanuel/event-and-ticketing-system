"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, ImageIcon } from "lucide-react";
import { useUploadThing, uploadsEnabled } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function ImageUpload({
  label,
  value,
  onChange,
  id,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  id?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl;
      if (url) onChange(url);
      setError(null);
    },
    onUploadError: (e) => setError(e.message),
  });

  // Fallback: no upload service configured — let users paste a URL.
  if (!uploadsEnabled) {
    return (
      <div>
        <Label htmlFor={id}>{label} (image URL)</Label>
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
        />
      </div>
    );
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted" />
          )}
        </div>

        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) startUpload([file]);
              e.target.value = "";
            }}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
            >
              <UploadCloud className="h-4 w-4" />
              {isUploading ? "Uploading…" : value ? "Replace" : "Upload image"}
            </Button>
            {value && !isUploading && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
                <X className="h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted">PNG, JPG or GIF up to 4MB.</p>
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      </div>
    </div>
  );
}
