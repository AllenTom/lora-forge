import { ipcMain } from 'electron';
import { ChannelsKeys } from '../../../types';
import { getBackend } from '../backend/dispatch';
const getTrainConfigList = async () => {
  return getBackend().getTrainConfigList()
}
ipcMain.handle(ChannelsKeys.getTrainConfigs, async (event, arg) => {
  return await getTrainConfigList();
});
