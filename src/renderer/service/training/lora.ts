import { ipcRenderer } from '../base';
import { ChannelsKeys, LoraOutputModel, SdModel } from '../../../types';

export const getLoraList = async (): Promise<LoraOutputModel[]> => {
  return ipcRenderer.invoke(ChannelsKeys.loraGetModels);
};
export const exportModel = async ({ src, dest }: { src: string, dest: string }) => {
  await ipcRenderer.invoke(ChannelsKeys.loraExportModel, src, dest);
};
export const deleteLoraModel = async (modelPath: string) => {
  await ipcRenderer.invoke(ChannelsKeys.loraDeleteModel, modelPath);
};

export const getStableDiffusionModelList = async (): Promise<SdModel[]> => {
  return ipcRenderer.invoke(ChannelsKeys.getStableDiffusionModelList);
};
export const openStableDiffusionModelFolder = async () => {
  await ipcRenderer.invoke(ChannelsKeys.openStableDiffusionFolder);
};
