"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const all = Array.isArray(images) && images.length > 0 ? images : ["/placeholder.png"];

  const goNext = () => setActive((p) => (p + 1) % all.length);
  const goPrev = () => setActive((p) => (p - 1 + all.length) % all.length);

  /* ── Touch swipe handlers ── */
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;

    // Only swipe horizontally when horizontal movement dominates
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) goNext();
      else goPrev();
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div
        className="relative aspect-square rounded-xl overflow-hidden bg-[#FAFAFA] border border-[#E5E5E5] group cursor-grab active:cursor-grabbing select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={all[active]}
          alt={title}
          fill
          className="object-cover transition-opacity duration-200"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          draggable={false}
        />

        {/* Prev / Next arrows — always visible on mobile, fade-in on desktop hover */}
        {all.length > 1 && (
          <>
            <button
              onClick={goPrev}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center border border-[#E5E5E5] shadow-sm transition-opacity md:opacity-0 md:group-hover:opacity-100"
            >
              <i className="fa-solid fa-chevron-left text-[#111111] text-xs" />
            </button>
            <button
              onClick={goNext}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center border border-[#E5E5E5] shadow-sm transition-opacity md:opacity-0 md:group-hover:opacity-100"
            >
              <i className="fa-solid fa-chevron-right text-[#111111] text-xs" />
            </button>
          </>
        )}

        {/* Image counter badge */}
        {all.length > 1 && (
          <span className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full font-medium">
            {active + 1} / {all.length}
          </span>
        )}

        {/* Dot indicators for mobile */}
        {all.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
            {all.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === active ? "bg-[#A4860E] w-3" : "bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {all.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
          {all.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border transition-all snap-start ${
                i === active
                  ? "border-[#A4860E] ring-1 ring-[#A4860E]/40"
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
