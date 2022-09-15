import OVHook from "node-ovhook";
import { listWindows, setActiveWindow } from "./utils/ffi";

const extractMatches = (regexp: RegExp, text: string) => {
  const arr = text.match(new RegExp(regexp)) ?? [];
  return arr;
};

const main = () => {
  const list = listWindows();
  console.log(
    list.filter(
      (v) => extractMatches(/(retroarch) (.*) (.*)/gi, v.title).length
    )
  );

  console.log(OVHook.getTopWindows());

  const handle = 723180;
  setActiveWindow(handle);
};

main();
