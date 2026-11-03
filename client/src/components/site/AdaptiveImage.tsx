import { useState, type ImgHTMLAttributes } from "react";

type AdaptiveImageProps = ImgHTMLAttributes<HTMLImageElement> & { framed?: boolean };

export function AdaptiveImage({ className = "", onLoad, framed = false, ...props }: AdaptiveImageProps) {
  const [portrait, setPortrait] = useState(false);
  const image = (
    <img
      {...props}
      className={`${className}${portrait ? " is-portrait" : ""}`}
      onLoad={(event) => {
        const element = event.currentTarget;
        setPortrait(element.naturalHeight > element.naturalWidth * 1.15);
        onLoad?.(event);
      }}
    />
  );

  if (!framed) return image;

  return (
    <span className={`adaptive-image-frame${portrait ? " is-portrait" : ""}`}>
      {portrait && <img className="adaptive-image-frame__backdrop" src={props.src} alt="" aria-hidden="true" loading="lazy" decoding="async" />}
      {image}
    </span>
  );
}
