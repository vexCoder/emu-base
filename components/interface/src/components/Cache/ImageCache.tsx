import { useMount } from "ahooks";
import clsx from "clsx";
import { useState } from "react";

type ImageCacheProps = BaseComponentProps<"div"> & {
  path: string;
  url: string;
  imageProps?: BaseComponentProps<"img">;
};

const ImageCache = ({
  path,
  url,
  imageProps = {},
  ...rest
}: ImageCacheProps) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useMount(async () => {
    const loadImage = new Image();

    const imagePath = await window.data.getImage(path, url);
    loadImage.src = imagePath || url;

    loadImage.onload = () => {
      setImage(loadImage);
    };
  });

  return (
    <div {...rest} className={clsx(rest.className, "image-cache-container")}>
      {image && (
        <img
          {...imageProps}
          className={clsx(imageProps.className, "image-cache-image")}
          src={image.src}
          alt="test"
        />
      )}
    </div>
  );
};

export default ImageCache;
