"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  X
} from "lucide-react";

type Props = {
  images: string[];
  name: string;
  discount?: number;
};

export function ProductGallery({
  images,
  name,
  discount = 0
}: Props) {
  const gallery = Array.from(
    new Set(images.filter(Boolean))
  );

  const [selected, setSelected] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  const current = gallery[selected] || gallery[0];

  function previous() {
    setSelected((index) =>
      (index - 1 + gallery.length) % gallery.length
    );
  }

  function next() {
    setSelected((index) =>
      (index + 1) % gallery.length
    );
  }

  useEffect(() => {
    if (!zoomOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setZoomOpen(false);
      }
      if (event.key === "ArrowLeft" && gallery.length > 1) {
        setSelected((index) =>
          (index - 1 + gallery.length) % gallery.length
        );
      }
      if (event.key === "ArrowRight" && gallery.length > 1) {
        setSelected((index) => (index + 1) % gallery.length);
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [zoomOpen, gallery.length]);

  if (!current) {
    return (
      <div className="nmpg-empty">
        Product image not available
      </div>
    );
  }

  const isUploaded = (src: string) =>
    src.startsWith("/uploads/");

  return (
    <div className="nmpg-gallery">
      <div className="nmpg-main">
        <Image
          src={current}
          alt={`${name} — image ${selected + 1}`}
          fill
          priority={selected === 0}
          sizes="(max-width: 850px) 100vw, 50vw"
          className="nmpg-main-photo"
          unoptimized={isUploaded(current)}
        />

        {discount > 0 && (
          <span className="nmpg-discount">
            SAVE {discount}%
          </span>
        )}

        <button
          type="button"
          className="nmpg-zoom-button"
          aria-label="View product image fullscreen"
          onClick={() => setZoomOpen(true)}
        >
          <Expand size={18} />
        </button>

        {gallery.length > 1 && (
          <>
            <button
              type="button"
              className="nmpg-arrow nmpg-arrow-left"
              onClick={previous}
              aria-label="Previous product image"
            >
              <ChevronLeft size={23} />
            </button>

            <button
              type="button"
              className="nmpg-arrow nmpg-arrow-right"
              onClick={next}
              aria-label="Next product image"
            >
              <ChevronRight size={23} />
            </button>
          </>
        )}

        <span className="nmpg-counter">
          {selected + 1} / {gallery.length}
        </span>
      </div>

      {gallery.length > 1 && (
        <div
          className="nmpg-thumbnails"
          role="group"
          aria-label="Product image thumbnails"
        >
          {gallery.map((src, index) => (
            <button
              type="button"
              key={`${src}-${index}`}
              className={
                "nmpg-thumb" +
                (selected === index ? " nmpg-thumb-active" : "")
              }
              aria-label={`View image ${index + 1}`}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              <Image
                src={src}
                alt={`${name} thumbnail ${index + 1}`}
                fill
                sizes="100px"
                unoptimized={isUploaded(src)}
              />
            </button>
          ))}
        </div>
      )}

      {zoomOpen && (
        <div
          className="nmpg-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${name} image viewer`}
        >
          <div className="nmpg-lightbox-header">
            <span>
              {name} · {selected + 1}/{gallery.length}
            </span>
            <button
              type="button"
              onClick={() => setZoomOpen(false)}
              aria-label="Close fullscreen image"
            >
              <X size={23} />
            </button>
          </div>

          <div className="nmpg-lightbox-content">
            {gallery.length > 1 && (
              <button
                type="button"
                onClick={previous}
                aria-label="Previous fullscreen image"
              >
                <ChevronLeft size={26} />
              </button>
            )}

            <div className="nmpg-lightbox-photo">
              <Image
                src={current}
                alt={`${name} enlarged`}
                fill
                sizes="100vw"
                unoptimized={isUploaded(current)}
              />
            </div>

            {gallery.length > 1 && (
              <button
                type="button"
                onClick={next}
                aria-label="Next fullscreen image"
              >
                <ChevronRight size={26} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
