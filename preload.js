const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  moveWindow: (dx, dy) => ipcRenderer.send('move-window', { dx, dy }),
  getScreenInfo: () => ipcRenderer.invoke('get-screen-info'),
  setIgnoreMouse: (ignore) => ipcRenderer.send('set-ignore-mouse', ignore),
  onAction: (callback) => ipcRenderer.on('action', (event, action) => callback(action))
});
