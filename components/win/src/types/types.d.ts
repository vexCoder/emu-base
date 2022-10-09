interface Application {
  quitting: boolean;
  win?: import('electron').BrowserWindow;
  overlay?: import('../overlay').default;
  emulator?: import('../emulator').default;

  setEmulator(emu: import('../emulator').default);

  init(): Application;
  makeWindow(): Application;
  startEvents(): Application;
  attachHandlers(): Application;
}
