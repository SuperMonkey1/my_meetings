const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const http = require('http');
const net = require('net');
const { pathToFileURL } = require('url');
const fs = require('fs');

let mainWindow = null;
let server = null;

const isDev = process.env.NODE_ENV === 'development' || (!app.isPackaged && process.argv.includes('--dev'));

if (process.platform === 'win32') {
  app.setAppUserModelId('com.mymeetings.app');
}

function log(msg) {
  const logLine = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(path.join(app.getPath('userData'), 'app.log'), logLine);
  } catch {}
  console.log(msg);
}

function getFreePort(startPort = 3990) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.listen(startPort, '127.0.0.1', () => {
      const port = s.address().port;
      s.close(() => resolve(port));
    });
    s.on('error', () => {
      resolve(getFreePort(startPort + 1));
    });
  });
}

async function startInternalServer(port) {
  process.env.PORT = port.toString();
  process.env.HOST = '127.0.0.1';
  process.env.NODE_ENV = 'production';
  if (!process.env.DATA_DIR) {
    process.env.DATA_DIR = path.resolve(__dirname, '../data');
  }

  const handlerPath = path.join(__dirname, '../build/handler.js');
  if (!fs.existsSync(handlerPath)) {
    throw new Error(`Build directory not found at: ${handlerPath}. Please run 'npm run build' first.`);
  }

  const handlerUrl = pathToFileURL(handlerPath).href;
  log(`Importing SvelteKit handler from: ${handlerUrl}`);
  const { handler } = await import(handlerUrl);

  return new Promise((resolve, reject) => {
    server = http.createServer(handler);
    server.listen(port, '127.0.0.1', () => {
      log(`Internal SvelteKit server listening on http://127.0.0.1:${port}`);
      resolve(port);
    });
    server.on('error', reject);
  });
}

async function createWindow() {
  const iconPath = path.join(__dirname, '../static/app-icon.ico');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    title: 'My Meetings - Audio Transcription & Intelligence',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#f8fafc',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  let appUrl = 'http://localhost:5173';

  if (!isDev) {
    try {
      const port = await getFreePort(3990);
      await startInternalServer(port);
      appUrl = `http://127.0.0.1:${port}`;
    } catch (err) {
      log(`Error starting server: ${err.stack || err}`);
      dialog.showErrorBox('Startup Error', `Failed to start My Meetings backend:\n${err.message}`);
      app.quit();
      return;
    }
  }

  mainWindow.loadURL(appUrl);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('mailto:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  log('Another instance is already running. Quitting duplicate instance.');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createWindow).catch((err) => {
    log(`whenReady error: ${err.stack || err}`);
  });
}

app.on('window-all-closed', () => {
  if (server) {
    server.close();
    server = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (server) {
    server.close();
    server = null;
  }
});
