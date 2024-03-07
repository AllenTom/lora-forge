import { ipcRenderer } from '../base';
import { ChannelsKeys, PretrainModel } from '../../../types';

export const getPretrainedModelList = async ():Promise<PretrainModel[]> => {
  return await ipcRenderer.invoke(ChannelsKeys.getPretrainModels);
}
export const openPretrainedModelFolder = async () => {
  await ipcRenderer.invoke(ChannelsKeys.openPretrainFolder);
}
