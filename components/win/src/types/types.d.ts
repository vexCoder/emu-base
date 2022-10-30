interface Application {
  win?: import('electron').BrowserWindow;
  overlay?: import('../overlay').default;
  emulator?: import('../emulator').default;

  setEmulator(emu: import('../emulator').default);

  init(): Application;
  makeWindow(settings: AppSettings): Application;
  startEvents(): Application;
  attachHandlers(): Application;
}