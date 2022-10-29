import clsx from "clsx";
import { join } from "ramda";
import { useState, useEffect } from "react";

type SlotImageProps = {
  className?: string;
  slot: number;
  console: string;
  game: string;
  imageProps?: BaseComponentProps<"img">;
  timestamp: number;
};

const SlotImage = ({
  slot,
  console: cons,
  game,
  imageProps = {},
  timestamp,
  ...rest
}: SlotImageProps) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    window.data
      .getImage(join("/", [cons, game, "savestate", `slot_${slot}.png`]))
      .then((src) => {
        const loadImage = new Image();

        loadImage.src = src ?? "data:image/png;base64,";

        loadImage.onload = () => {
          setImage(loadImage);
        };
      });
  }, [slot, cons, game, setImage, timestamp]);

  return (
    <div {...rest} className={clsx(rest.className, "image-cache-container")}>
      {image && (
        <img
          {...imageProps}
          className={clsx(
            imageProps.className,
            "image-cache-image object-cover"
          )}
          src={image.src}
          alt="test"
        />
      )}
    </div>
  );
};

export default SlotImage;
