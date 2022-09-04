import { MainStore, useMainStore } from "@utils/store.utils";
import { pick } from "ramda";

const selector = (v: MainStore) => pick(["eject"], v);

const Play = () => {
  const store = useMainStore(selector);
  return (
    <div className="fixed top-0 left-0 w-[100vw] h-[100vh] bg-black z-[60]">
      <button
        type="button"
        className="text-text p-2"
        onClick={() => {
          store.eject();
        }}
      >
        Back
      </button>
    </div>
  );
};

export default Play;
