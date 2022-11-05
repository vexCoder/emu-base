interface Application {
  icon: string;
  win?: import('electron').BrowserWindow;
  overlay?: import('../overlay').default;
  emulator?: import('../emulator').default;

  setEmulator(emu: import('../emulator').default);

  init(): Promise<Application>;
  makeWindow(settings: AppSettings): Application;
  startEvents(): Application;
  attachHandlers(): Application;
}