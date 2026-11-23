"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";

export function ImageInput(props: {
  name: string;
  label: string;
  accept: readonly string[];
  help: string;
  error?: string;
  rounded?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const id = `field-${props.name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
        {props.label}
      </label>
      <div className="mt-2 flex items-center gap-4">
        <div
          className={`grid size-20 shrink-0 place-items-center overflow-hidden bg-slate-100 ring-1 ring-slate-200 ${props.rounded ? "rounded-full" : "rounded-xl"}`}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-6 text-slate-400" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input
            id={id}
            name={props.name}
            type="file"
            required
            accept={props.accept.join(",")}
            aria-invalid={props.error ? true : undefined}
            aria-describedby={`${id}-help`}
            onChange={(e) => {
              if (preview) URL.revokeObjectURL(preview);
              const file = e.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
          />
          <p id={`${id}-help`} className="mt-1 text-xs text-slate-500">
            {props.help}
          </p>
          {props.error && <p className="mt-1 text-sm text-red-600">{props.error}</p>}
        </div>
      </div>
    </div>
  );
}
