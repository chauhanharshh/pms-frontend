const { app, BrowserWindow, ipcMain, shell, session, Menu } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;
const DEV_URL = 'http://localhost:3000';
const BUILD_INDEX_PATH = path.join(__dirname, '../build/index.html');

let cookieStore;

let mainWindow;
let isSavingCookies = false;

// Apply strict, explicit security headers for all responses loaded in the app.
function registerContentSecurityPolicy() {
  const csp = isDev
    ? "default-src 'self' http://localhost:3000 ws://localhost:3000 data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3000; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' http://localhost:3000 ws://localhost:3000 https:; frame-ancestors 'none'; base-uri 'self'; object-src 'none';"
    : "default-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; object-src 'none';";

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = {
      ...details.responseHeaders,
      'Content-Security-Policy': [csp],
    };

    callback({ responseHeaders });
  });
}

// Restore cookies saved in electron-store before any windows are created.
async function restoreCookies() {
  if (!cookieStore) {
    return;
  }

  const cookies = cookieStore.get('cookies', []);

  for (const cookie of cookies) {
    try {
      await session.defaultSession.cookies.set(cookie);
    } catch {
      // Ignore malformed/expired cookie records.
    }
  }
}

// Persist cookies to electron-store so sessions survive app restarts.
async function persistCookies() {
  if (isSavingCookies || !cookieStore) {
    return;
  }

  isSavingCookies = true;
  try {
    const cookies = await session.defaultSession.cookies.get({});
    cookieStore.set('cookies', cookies);
  } finally {
    isSavingCookies = false;
  }
}

async function initializeCookieStore() {
  const { default: Store } = await import('electron-store');
  cookieStore = new Store({
    name: 'electron-session',
    defaults: {
      cookies: [],
    },
  });
}

function registerWindowControlHandlers() {
  ipcMain.on('window-minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (!mainWindow) {
      return;
    }

    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#1a1f2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  // Allow window.open() for print windows
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url === 'about:blank' || url === '') {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 800,
          height: 600,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          }
        }
      }
    }
    // Open external URLs in system browser
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation to external sites inside the app window.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isInternal = isDev
      ? url.startsWith(DEV_URL)
      : url.startsWith('file://');

    if (!isInternal) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  if (isDev) {
    mainWindow.loadURL(DEV_URL);
  } else {
    mainWindow.loadFile(BUILD_INDEX_PATH);
  }
}

// Provide only safe app metadata to the renderer.
ipcMain.handle('app:get-info', () => ({
  version: app.getVersion(),
  platform: process.platform,
}));

ipcMain.on('print-html', (event, html) => {
  const printWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });
  
  printWindow.loadURL('about:blank');
  printWindow.webContents.on('did-finish-load', () => {
    printWindow.webContents.executeJavaScript(`
      document.write(${JSON.stringify(html)});
      document.close();
    `).then(() => {
      setTimeout(() => {
        printWindow.webContents.print({ silent: true, printBackground: true }, (success) => {
          printWindow.close();
        });
      }, 500);
    });
  });
});

// Register IPC handlers before any renderer tries to use them.
registerWindowControlHandlers();

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  registerContentSecurityPolicy();
  await initializeCookieStore();
  await restoreCookies();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async (event) => {
  if (isSavingCookies || !cookieStore) {
    return;
  }

  event.preventDefault();
  await persistCookies();
  app.exit(0);
});
