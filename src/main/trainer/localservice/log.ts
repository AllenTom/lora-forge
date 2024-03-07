import { getLogPath } from '../../main';
import fs from 'fs';
import { ipcMain, shell } from 'electron';
import { ChannelsKeys } from '../../../types';
import path from 'path';

const exportLog = (exportPath: string) => {
  const logPath = getLogPath();
  const targetPath = path.join(exportPath, 'sdtlog.txt');
  fs.copyFileSync(logPath, targetPath);
  shell.openPath(exportPath);
  return targetPath;
};

ipcMain.handle(ChannelsKeys.exportLog, async (event, exportPath) => {
  const savePath = exportLog(exportPath);
  return {
    exportPath: savePath
  };
});

ipcMain.on(ChannelsKeys.openLog, async (event) => {
  const logPath = getLogPath();
  shell.openPath(logPath);
})