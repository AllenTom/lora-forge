import { ChannelsKeys, TrainerSettings } from '../../../types';
import { ipcRenderer } from '../base';

export const readTrainerSettings = ():Promise<TrainerSettings|undefined> => {
  return ipcRenderer.invoke(ChannelsKeys.readTrainerSettings)
}

export const saveTrainerSettings = (settings:TrainerSettings) => {
  return ipcRenderer.invoke(ChannelsKeys.saveTrainerSettings, settings)
}
