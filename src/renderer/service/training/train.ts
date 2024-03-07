import { ipcRenderer } from '../base';
import { ChannelsKeys, LorePreset, TrainConfig, TrainingConfig } from '../../../types';

export const startTraining = async (config: TrainingConfig) => {
  console.log('start training');
  await ipcRenderer.sendMessage(ChannelsKeys.startTraining, config);
};
export const openTrainerWindow = async () => {
  await ipcRenderer.sendMessage(ChannelsKeys.openTrainer);
};

export const addTrainConfig = async (config: LorePreset) => {
  await ipcRenderer.invoke(ChannelsKeys.addLoraData, config);
};
export const removeTrainConfig = async (name: string) => {
  await ipcRenderer.invoke(ChannelsKeys.removeLoraData, name);
};

export const getLoraPresetList = async (): Promise<LorePreset[]> => {
  return await ipcRenderer.invoke(ChannelsKeys.getLoraPresetList);
};


export const generateLoraImage2 = async (args: { loraModelPath: string,props?:any,lora:number }) => {
  ipcRenderer.invoke(ChannelsKeys.loraGenerateImage2, args);
};

export const interruptImageGeneration = async () => {
  await ipcRenderer.sendMessage(ChannelsKeys.interruptGenerateImage);
}

export const getTrainConfigs = async (): Promise<TrainConfig[]> => {
  return await ipcRenderer.invoke(ChannelsKeys.getTrainConfigs);
};

export const saveTrainConfig = async (config: TrainConfig) => {
  await ipcRenderer.invoke(ChannelsKeys.saveTrainConfig, config);
};

export const deleteTrainConfig = async (id: string) => {
  await ipcRenderer.invoke(ChannelsKeys.deleteTrainConfig, id);
};

export const getPreviewProps = async () => {
  return await ipcRenderer.invoke(ChannelsKeys.getPreviewProps);
}
export const savePreviewProps = async (previewProps: any) => {
  await ipcRenderer.invoke(ChannelsKeys.savePreviewProps, previewProps);
}
export const getTrainPreview = async (config: TrainingConfig) => {
  return await ipcRenderer.invoke(ChannelsKeys.getTrainPreview, config);
}
