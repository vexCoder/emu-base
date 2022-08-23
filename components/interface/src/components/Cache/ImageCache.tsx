import { useMountEffect } from "@react-hookz/web";
import { HTMLAttributes, useState } from "react";

interface ImageCacheProps extends HTMLAttributes<HTMLImageElement> {
  path: string;
  url: string;
}

const ImageCache = ({ path, url, ...rest }: ImageCacheProps) => {
  const [img, setImage] = useState<HTMLImageElement | null>(null);
  useMountEffect(async () => {
    const image = new Image();

    const imagePath = await window.data.getImage(path, url);
    image.src = imagePath || url;

    image.onload = () => {
      setImage(image);
    };
  });

  return <img src={img?.src} {...rest} alt="test" />;
};

export default ImageCache;
