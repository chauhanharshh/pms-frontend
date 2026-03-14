export {};

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      platform: string;
      getAppInfo?: () => Promise<{ version: string; platform: string }>;
    };
  }
}
