import { ipcRenderer } from '../base';
import { ChannelsKeys } from '../../../types';

export const exportLog = async (exportPath:string) => {
  return ipcRenderer.invoke(ChannelsKeys.exportLog, exportPath);
}
export const openLog = async () => {
  return ipcRenderer.sendMessage(ChannelsKeys.openLog)
}
