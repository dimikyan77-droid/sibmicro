import { useState, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import componentPlaceholder from "@/assets/component-placeholder.png";

interface ProductImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  alt: string;
  /** Wrapper class — sizing & layout */
  wrapperClassName?: string;
}

/**
 * Product image with blurred placeholder + smooth fade-in on load.
 * Falls back to componentPlaceholder if src missing or fails.
 */
const ProductImage = ({
  src,
  alt,
  className,
  wrapperClassName,
  loading = "lazy",
  decoding = "async",
  ...rest
}: ProductImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const finalSrc = !src || errored ? componentPlaceholder : src;

  return (
    <div className={cn("relative overflow-hidden", wrapperClassName)}>
      {/* Blurred placeholder layer */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-muted/40 transition-opacity duration-500",
          loaded ? "opacity-0" : "opacity-100"
        )}
      >
        <img
          src={componentPlaceholder}
          alt=""
          className="w-2/3 h-2/3 object-contain blur-md scale-110 opacity-60"
          aria-hidden
        />
      </div>

      {/* Actual image, fades in on load */}
      <img
        src={finalSrc}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setErrored(true);
          setLoaded(true);
        }}
        className={cn(
          "relative transition-opacity duration-500 ease-out",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        {...rest}
      />
    </div>
  );
};

export default ProductImage;
