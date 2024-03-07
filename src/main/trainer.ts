import { app, BrowserWindow, ipcMain, screen, shell } from 'electron';
import * as path from 'path';
import { resolveHtmlPath } from './util';
import { ChannelsKeys } from '../types';

export let splashWindow: BrowserWindow | null = null;
export let installWindow: BrowserWindow | null = null;
export let editorWindow: BrowserWindow | null = null;

export const openSplashWindow = () => {
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  splashWindow = new BrowserWindow({
    show: false,
    width: 700,
    height: 400,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js')
    },
    frame: false
  });

  splashWindow.loadURL(resolveHtmlPath('index.html') + '#/trainer/splash');

  splashWindow.on('ready-to-show', () => {
    if (!splashWindow) {
      throw new Error('"splashWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      splashWindow.minimize();
    } else {
      splashWindow.show();
    }
  });
  splashWindow.setMenu(null);
  // open dev tools

  splashWindow.on('closed', () => {
    splashWindow = null;
  });

  // Open urls in the user's browser
  splashWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

};

ipcMain.on(ChannelsKeys.openSplash, async (event, arg) => {
  if (!splashWindow) {
    openSplashWindow();
  } else {
    splashWindow.show();
  }
});

export const openInstallWindow = () => {
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  installWindow = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      webSecurity: false
    }
  });

  installWindow.loadURL(resolveHtmlPath('index.html') + '#/trainer/install');

  installWindow.on('ready-to-show', () => {
    if (!installWindow) {
      throw new Error('"installWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      installWindow.minimize();
    } else {
      installWindow.show();
    }
  });
  installWindow.setMenu(null);
  // open dev tools

  installWindow.on('closed', () => {
    installWindow = null;
  });

  // Open urls in the user's browser
  installWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

};

ipcMain.on(ChannelsKeys.openInstall, async (event, arg) => {
  if (!installWindow) {
    openInstallWindow();
  } else {
    installWindow.show();
  }
});

export const openEditorWindow = () => {
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize
  console.log(width,height)
  editorWindow = new BrowserWindow({
    show: false,
    width: width-300,
    height: height - 300,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      webSecurity: false
    },
    frame: false
  });

  // preprocess



  editorWindow.loadURL(resolveHtmlPath('index.html') + '#/trainer/editor');

  editorWindow.on('ready-to-show', () => {
    if (!editorWindow) {
      throw new Error('"editorWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      editorWindow.minimize();
    } else {
      editorWindow.show();
    }
  });

  // open dev tools

  editorWindow.on('closed', () => {
    editorWindow = null;
  });
  editorWindow.setMenu(null);

  // Open urls in the user's browser
  editorWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};


ipcMain.on(ChannelsKeys.openEditor, async (event, arg) => {
  if (!editorWindow) {
    openEditorWindow();
  } else {
    editorWindow.show();
  }
});

ipcMain.on(ChannelsKeys.closeSplash, async (event, arg) => {
  if (splashWindow) {
    splashWindow.close();
  }
});
ipcMain.on(ChannelsKeys.closeInstall, async (event, arg) => {
  if (installWindow) {
    installWindow.close();
  }
});

ipcMain.on(ChannelsKeys.trainerWindowResize, () => {
  if (!editorWindow) {
    return;
  }

  if (editorWindow.isMaximized()) {
    editorWindow.unmaximize();
  } else {
    editorWindow.maximize();
  }

});
ipcMain.on(ChannelsKeys.trainerWindowHide, () => {
  if (!editorWindow) {
    return;
  }
  editorWindow.minimize();
});

ipcMain.on(ChannelsKeys.trainWindowClose, () => {
  app.quit();
});
