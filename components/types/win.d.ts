interface GameRegionFiles {
  title: string;
  region: string;
  gameFiles: {
    serial: string;
    playable: boolean;
    link: ParsedLinks;
    path: string | undefined;
  }[];
}

interface GameDiscMappings {
  [key: string]: ParsedLinks;
}

interface DownloadProgress {
  percentage: number;
  total: number;
  transferred: number;
  status: string;
}

interface DiskData {
  access: string;
  availability: string;
  blockSize: string;
  caption: string;
  compressed: string;
  configManagerErrorCode: string;
  configManagerUserConfig: string;
  creationClassName: string;
  description: string;
  deviceId: string;
  driveType: string;
  errorCleared: string;
  errorDescription: string;
  errorMethodology: string;
  fileSystem: string;
  freeSpace: string;
  installDate: string;
  lastErrorCode: string;
  maximumComponentLength: string;
  mediaType: string;
  name: string;
  numberOfBlocks: string;
  pnpDeviceId: string;
  powerManagementCapabilities: string;
  powerManagementSupported: string;
  providerName: string;
  purpose: string;
  quotasDisabled: string;
  quotasIncomplete: string;
  quotasRebuilding: string;
  size: string;
  status: string;
  statusInfo: string;
  supportsDiskQuotas: string;
  supportsFileBasedCompression: string;
  systemCreationClassName: string;
  systemName: string;
  volumeDirty: string;
  volumeName: string;
  volumeSerialNumber: string;
}

interface OpenPathOptions {
  path?: string;
  options?: {
    folderOnly?: boolean;
  };
}

interface FileItem {
  path: string;
  name: string;
  isDirectory: boolean;
}

interface ShutdownSettings {
  abort: boolean;
  timeout: number;
}