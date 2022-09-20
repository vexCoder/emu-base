import MountSubscriber from "@providers/MountSubscriber";
import OverlayMenu from "./OverlayMenu";
import OverlayPerformance from "./OverlayPerformance";
import OverlayStates from "./OverlayStates";

const Overlay = () => {
  return (
    <MountSubscriber>
      <div className="w-[100vw] h-[100vh] p-4">
        <OverlayPerformance />
        <OverlayMenu />
        <OverlayStates />
      </div>
    </MountSubscriber>
  );
};

export default Overlay;
