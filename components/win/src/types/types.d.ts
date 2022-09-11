interface Application {
  win?: import('electron').BrowserWindow;
  overlay?: import('./overlay').default;

  init(): Application;
  makeWindow(): Application;
  startEvents(): Application;
  attachHandlers(): Application;
}
