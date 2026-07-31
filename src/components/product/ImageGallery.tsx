"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [active, setActive] = useState(0);

  const all = Array.isArray(images) && images.length > 0 ? images : ["/placeholder.png"];

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-md overflow-hidden bg-[#FAFAFA] border border-[#E5E5E5] group">
        <Image
          src={all[active]}
          alt={title}
          fill
          className="object-cover transition-opacity duration-200"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {/* Prev / Next arrows */}
        {all.length > 1 && (
          <>
            <button
              onClick={() => setActive((p) => (p - 1 + all.length) % all.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center border border-[#E5E5E5] hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg className="w-4 h-4 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setActive((p) => (p + 1) % all.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center border border-[#E5E5E5] hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg className="w-4 h-4 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
        {/* Image counter */}
        {all.length > 1 && (
          <span className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded">
            {active + 1} / {all.length}
          </span>
        )}
      </div>

      {/* Thumbnail strip — all images */}
      {all.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {all.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative shrink-0 w-16 h-16 rounded-md overflow-hidden border transition-all ${
                i === active
                  ? "border-[#2563EB]"
                  : "border-[#E5E5E5] hover:border-[#D0D0D0]"
              }`}
            >
              <Image
                src={img}
                alt={`${title} view ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

