import { createPortal } from "react-dom";

type YoutubeAudioProps = BaseComponentProps<"div"> & {
  tag: string;
  autoplay?: boolean;
  mute?: boolean;
};

const YoutubeAudio = ({
  tag,
  autoplay = true,
  mute = false,
  ...props
}: YoutubeAudioProps) => {
  return createPortal(
    <div {...props}>
      <iframe
        className="video"
        title="Youtube player"
        sandbox="allow-same-origin allow-forms allow-popups allow-scripts allow-presentation"
        allow="autoplay; encrypted-media"
        src={`https://youtube.com/embed/${tag}?autoplay=${Number(
          autoplay
        )}&mute=${Number(mute)}`}
        style={{ visibility: "hidden", position: "fixed" }}
      />
    </div>,
    document.body
  );
};

export default YoutubeAudio;
