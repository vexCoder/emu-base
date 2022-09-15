import { MainStore, useMainStore } from "@utils/store.utils";
import { useMount } from "ahooks";
import { pick } from "ramda";

const selector = (v: MainStore) => pick(["eject"], v);

const Play = () => {
  const store = useMainStore(selector);

  useMount(() => {
    console.log(window.data.onDetach(() => {}));
    window.data.onDetach(() => {
      console.log("ejected");
      store.eject();
    });
  });

  return (
    <div className="fixed top-0 left-0 w-[100vw] h-[100vh] bg-black z-[60]" />
  );
};

export default Play;
