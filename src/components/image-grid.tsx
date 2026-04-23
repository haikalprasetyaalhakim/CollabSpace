"use client";

import { useState } from "react";
import { Lightbox } from "./lightbox";

type Props = {
  images: string[];
};

export function ImageGrid({ images }: Props) {
  const [lightbox, setLightBox] = useState<number | null>(null);
  const count = images.length;

  const imgClass =
    "rounded-lg object-cover w-full h-full cursor-zoom-in hover:opacity-90 transition-opacity";

  return (
    <>
      {count === 1 && (
        <div className="mt-1 max-w-xs">
          <img
            src={images[0]}
            alt="Message image"
            className="rounded-lg object-cover max-h-[300px] cursor-zoom-in hover:opacity-90 transition-opacity"
            onClick={() => setLightBox(0)}
          />
        </div>
      )}

      {count === 2 && (
        <div className="mt-1 max-w-xs grid grid-cols-2 gap-1">
          {images.map((url, i) => (
            <img
              key={url}
              src={url}
              alt="Message image"
              className={imgClass}
              style={{ height: "150px" }}
              onClick={() => setLightBox(i)}
            />
          ))}
        </div>
      )}

      {count === 3 && (
        <div
          className="mt-1 max-w-xs grid grid-cols-2 gap-1"
          style={{ gridTemplateRows: "150px 150px" }}
        >
          <img
            src={images[0]}
            alt="Message item"
            className={`${imgClass} row-span-2`}
            onClick={() => setLightBox(0)}
          />
          <img
            src={images[1]}
            alt="Message item"
            className={imgClass}
            onClick={() => setLightBox(1)}
          />
          <img
            src={images[2]}
            alt="Message item"
            className={imgClass}
            onClick={() => setLightBox(2)}
          />
        </div>
      )}

      {count === 4 && (
        <div className="mt-1 max-w-xs grid grid-cols-2 gap-1">
          {images.map((url, i) => (
            <img
              key={url}
              src={url}
              className={imgClass}
              alt="Message image"
              style={{ height: "150px" }}
              onClick={() => setLightBox(i)}
            />
          ))}
        </div>
      )}

      {lightbox !== null && (
        <Lightbox
          images={images}
          startIndex={lightbox}
          onClose={() => setLightBox(null)}
        />
      )}
    </>
  );
}
