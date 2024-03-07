import { ipcMain } from 'electron';
import { ChannelsKeys } from '../../../types';
import { getBackend } from '../backend/dispatch';

ipcMain.handle(ChannelsKeys.loraGetModels, async (event) => {
  return getBackend().loadModel()
});

