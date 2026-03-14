const { contextBridge, ipcRenderer } = require('electron');

// Expose only safe window-control APIs to the renderer.
contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  platform: process.platform,
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
});
