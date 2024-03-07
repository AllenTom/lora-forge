import { ChannelsKeys, DataStoreKeys, TrainerSettings } from '../../../types';
import { dataStore } from '../../store';
import { dialog, ipcMain, shell } from 'electron';
import path from 'path';

const readTrainerSettings = (): TrainerSettings => {
  return dataStore.get(DataStoreKeys.trainerSetting)
}
ipcMain.handle(ChannelsKeys.readTrainerSettings,() => {
  return readTrainerSettings();
})
const updateTrainerSettings = (settings: TrainerSettings) => {
  dataStore.set(DataStoreKeys.trainerSetting, settings);
}

ipcMain.handle(ChannelsKeys.saveTrainerSettings, (event, settings: TrainerSettings) => {
  updateTrainerSettings(settings);
})

ipcMain.on(ChannelsKeys.saveConfig, async (event, key, value) => {
  console.log({ key, value });
  dataStore.set(key, value);
});

ipcMain.handle(ChannelsKeys.readConfig, async (event, key) => {
  console.log({ key })
  return dataStore.get(key);
});

ipcMain.handle(ChannelsKeys.selectFolder,async (event, { title,hasDirname }) => {
  const { filePaths } = await dialog.showOpenDialog({
    title,
    properties: ['openDirectory']
  })
  if (filePaths.length === 0) {
    return
  }
  if (hasDirname){
    return {
      path:filePaths[0],
      dirname:path.basename(filePaths[0])
    }
  }
  return filePaths[0]
})

ipcMain.on(ChannelsKeys.openFolder, async (event, to) => {
  await shell.openPath(to);
});

