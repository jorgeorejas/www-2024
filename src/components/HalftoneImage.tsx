import { HalftoneCmyk } from "@paper-design/shaders-react";
import { useEffect, useState } from "react";

interface HalftoneImageProps {
  src: string;
  alt: string;
}

export default function HalftoneImage({ src, alt }: HalftoneImageProps) {
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    // Load image to get actual dimensions
    const img = new Image();
    img.onload = () => {
      // Container has max-w-screen-md (768px) with px-5 (40px total padding)
      // So actual content width is 728px
      const maxWidth = 728;
      const aspectRatio = img.height / img.width;

      if (img.width > maxWidth) {
        setDimensions({
          width: maxWidth,
          height: Math.round(maxWidth * aspectRatio),
        });
      } else {
        setDimensions({ width: img.width, height: img.height });
      }
    };
    img.src = src;
  }, [src]);

  // Don't render until we have dimensions
  if (!dimensions) {
    return (
      <div className="my-8 flex items-center justify-center min-h-[400px]">
        <span className="text-soft-gray">Loading...</span>
      </div>
    );
  }

  return (
    <div
      className="my-8 rounded-sm w-full overflow-hidden"
      style={{
        aspectRatio: `${dimensions.width} / ${dimensions.height}`
      }}
    >
      <HalftoneCmyk
        width={dimensions.width}
        height={dimensions.height}
        image={src}
        colorBack="#fbfaf4"
        colorC="#00b3ff"
        colorM="#fc4f9d"
        colorY="#ffd900"
        colorK="#231f20"
        size={0.008}
        gridNoise={0.15}
        type="ink"
        softness={0.8}
        contrast={1.05}
        fit="contain"
      />
      <span className="sr-only">{alt}</span>
    </div>
  );
}
