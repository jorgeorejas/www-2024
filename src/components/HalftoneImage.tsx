import type { ImgHTMLAttributes } from "react";

type HalftoneImageProps = ImgHTMLAttributes<HTMLImageElement>;

export default function HalftoneImage({ alt = "", ...props }: HalftoneImageProps) {
  return (
    <span className="halftone-image">
      <img alt={alt} {...props} />
      <span aria-hidden="true" className="halftone-image__cmyk" />
      <span aria-hidden="true" className="halftone-image__fade" />
    </span>
  );
}
