const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');

let win = null;
let tray = null;

const PET_WIDTH = 240;
const PET_HEIGHT = 320;

function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width: PET_WIDTH,
    height: PET_HEIGHT,
    x: Math.floor(screenWidth / 2 - PET_WIDTH / 2),
    y: screenHeight - PET_HEIGHT - 10,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Allow clicks to pass through transparent areas
  win.setIgnoreMouseEvents(false);
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  win.loadFile('index.html');

  // Prevent window from being closed on hide
  win.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });
}

function createTray() {
  // Use the idle sprite as tray icon (resized)
  const iconPath = path.join(__dirname, 'assets', 'idle.png');
  let trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 18, height: 18 });
  trayIcon.setTemplateImage(true);

  tray = new Tray(trayIcon);
  tray.setToolTip('Winston 在这里陪着你');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示 Winston',
      click: () => {
        win.show();
        win.webContents.send('action', 'wake');
      }
    },
    {
      label: '摸摸他',
      click: () => {
        win.show();
        win.webContents.send('action', 'pet');
      }
    },
    {
      label: '喂零食',
      click: () => {
        win.show();
        win.webContents.send('action', 'feed');
      }
    },
    { type: 'separator' },
    {
      label: '玩球球',
      click: () => {
        win.show();
        win.webContents.send('action', 'ball');
      }
    },
    {
      label: '击掌 ✋',
      click: () => {
        win.show();
        win.webContents.send('action', 'highfive');
      }
    },
    {
      label: '趴下休息',
      click: () => {
        win.show();
        win.webContents.send('action', 'liedown');
      }
    },
    {
      label: '讨要食物',
      click: () => {
        win.show();
        win.webContents.send('action', 'beg');
      }
    },
    { type: 'separator' },
    {
      label: '让他睡觉',
      click: () => {
        win.show();
        win.webContents.send('action', 'sleep');
      }
    },
    {
      label: '叫他起床',
      click: () => {
        win.show();
        win.webContents.send('action', 'wake');
      }
    },
    { type: 'separator' },
    {
      label: '退出（Winston 会想你的）',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

// IPC: Move the window (for walking & dragging)
ipcMain.on('move-window', (event, { dx, dy }) => {
  if (!win) return;
  const [x, y] = win.getPosition();
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  const { x: bx, y: by } = display.workArea;

  let newX = x + dx;
  let newY = y + dy;

  // Clamp within screen bounds
  newX = Math.max(bx, Math.min(newX, bx + width - PET_WIDTH));
  newY = Math.max(by, Math.min(newY, by + height - PET_HEIGHT));

  win.setPosition(newX, newY);
});

// IPC: Get screen bounds for renderer
ipcMain.handle('get-screen-info', () => {
  const display = screen.getPrimaryDisplay();
  return {
    workArea: display.workArea,
    petWidth: PET_WIDTH,
    petHeight: PET_HEIGHT,
    windowPos: win ? win.getPosition() : [0, 0]
  };
});

// IPC: Set ignore mouse events for transparent regions
ipcMain.on('set-ignore-mouse', (event, ignore, options) => {
  if (!win) return;
  if (ignore) {
    win.setIgnoreMouseEvents(true, { forward: true });
  } else {
    win.setIgnoreMouseEvents(false);
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win) win.show();
});
