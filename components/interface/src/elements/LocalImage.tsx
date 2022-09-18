import { useMount } from "ahooks";
import clsx from "clsx";
import { useState } from "react";

type LocalImageProps = BaseComponentProps<"div"> & {
  path: string;
  imageProps?: BaseComponentProps<"img">;
};

const LocalImage = ({ path, imageProps = {}, ...rest }: LocalImageProps) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useMount(async () => {
    const loadImage = new Image();

    const imagePath = await window.data.getImage(path);
    loadImage.src = imagePath ?? "data:image/png;base64,";

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

export default LocalImage;
