import { ipcRenderer } from '../base';
import { ChannelsKeys } from '../../../types';

export const interruptInstallTrainRepo = async () => {
  return ipcRenderer.invoke(ChannelsKeys.interruptInstallTrainRepo)
}
export const updateTrainRepo = async () => {
  return ipcRenderer.invoke(ChannelsKeys.updateTrainRepo)
}