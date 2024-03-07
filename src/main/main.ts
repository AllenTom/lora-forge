/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow } from 'electron';
import './trainer/export';
import './trainer/service/export';
import './trainer';
import { openEditorWindow, openInstallWindow } from './trainer';
import { runTrainerCallbackServer } from './trainer/localservice/server';
import { appPath, initPaths } from './paths';
import log from 'electron-log';
import { initApp } from './init';
import * as net from 'net';

// class AppUpdater {
//   constructor() {
//     log.transports.file.level = 'info';
//     autoUpdater.logger = log;
//     autoUpdater.checkForUpdatesAndNotify();
//   }
// }

export const getLogPath = () => {
  return path.join(appPath!, 'trainer.log');
};
log.transports.file.resolvePathFn = () => path.join(getLogPath());

export let trainerWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed

  app.quit();

});
app.on('quit', () => {

});

function findAvailablePort(startPort: number, callback: (err: Error | null, port?: number) => void) {
  const server = net.createServer();

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      // Port is in use, try the next one
      findAvailablePort(startPort + 1, callback);
    } else {
      // Other errors, pass it to the callback
      callback(err);
    }
  });

  server.listen(startPort, () => {
    // Port is available
    server.close(() => {
      callback(null, startPort);
    });
  });
}

app
  .whenReady()
  .then(() => {
    log.info('App starting...');
    log.info('App config initialized');
    initPaths();
    log.info('App paths initialized');
    log.info(`runAppServer`);
    const startPort = 6745; // Replace with your desired starting port
    findAvailablePort(startPort, (err, port) => {
      if (err) {
        log.info('Error:', err.message);
      } else {
        log.info('Available port:', port);
        runTrainerCallbackServer(port!);
      }
      // Add your application logic here using the available port
    });


    initApp()

    if (process.env.NODE_ENV === 'development' && process.env.SPLASH === '1') {
      // openSplashWindow()
      openInstallWindow()
    }else{
      openEditorWindow();
    }



    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.

      openEditorWindow();

    });
  })
  .catch(log.error);
