import { HalftoneCMYK } from "@paper-design/shaders-react";
import { useEffect, useState } from "react";

interface HalftoneImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export default function HalftoneImage({
  src,
  alt,
  width = 800,
  height = 600,
}: HalftoneImageProps) {
  const [dimensions, setDimensions] = useState({ width, height });

  useEffect(() => {
    // Load image to get actual dimensions
    const img = new Image();
    img.onload = () => {
      setDimensions({ width: img.width, height: img.height });
    };
    img.src = src;
  }, [src]);

  return (
    <div className="my-8 rounded-sm overflow-hidden">
      <HalftoneCMYK
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
      />
      <span className="sr-only">{alt}</span>
    </div>
  );
}
