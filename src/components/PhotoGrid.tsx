"use client";

import { filesToPhotos } from "@/lib/photos";
import { Camera, X } from "lucide-react";
import type { Photo } from "@/lib/types";

export function PhotoGrid({
  photos,
  onChange,
  editable = false,
}: {
  photos: Photo[];
  onChange?: (photos: Photo[]) => void;
  editable?: boolean;
}) {
  async function add(files: FileList | null) {
    if (!files?.length || !onChange) return;
    const next = await filesToPhotos(files);
    onChange([...photos, ...next].slice(0, 8));
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((photo) => (
        <div key={photo.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.dataUrl} alt={photo.name} className="h-full w-full object-cover" />
          {editable ? (
            <button
              type="button"
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ink/80 text-paper"
              onClick={() => onChange?.(photos.filter((item) => item.id !== photo.id))}
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ))}
      {editable && photos.length < 8 ? (
        <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink/25 bg-card text-steel hover:border-rust hover:text-rust">
          <Camera className="h-6 w-6" />
          <span className="text-[11px] font-semibold">Add photo</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(event) => add(event.target.files)}
          />
        </label>
      ) : null}
    </div>
  );
}
