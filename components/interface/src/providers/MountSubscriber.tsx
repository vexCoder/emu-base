import { useThemeStore } from "@utils/store.utils";
import { applyTheme } from "@utils/themes.utils";
import { useMount } from "ahooks";
import React from "react";

interface MountSubscriberProps {
  children: React.ReactNode;
}

const MountSubscriber = ({ children }: MountSubscriberProps) => {
  const themeStore = useThemeStore();

  useMount(() => {
    useThemeStore.subscribe(
      (state) => state.theme,
      (theme) => {
        applyTheme(theme);
      }
    );

    applyTheme(themeStore.theme);
  });

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
};

export default MountSubscriber;
