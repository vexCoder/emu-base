import clsx from "clsx";
import { join } from "ramda";
import { useState, useEffect } from "react";

type SlotImageProps = {
  className?: string;
  slot: number;
  console: string;
  game: string;
  imageProps?: BaseComponentProps<"img">;
};

const SlotImage = ({
  slot,
  console,
  game,
  imageProps = {},
  ...rest
}: SlotImageProps) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    window.data
      .getImage(join("/", [console, game, "savestate", `slot_${slot}.png`]))
      .then((src) => {
        const loadImage = new Image();

        loadImage.src = src ?? "data:image/png;base64,";

        loadImage.onload = () => {
          setImage(loadImage);
        };
      });
  }, [slot, console, game, setImage]);

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

export default SlotImage;
