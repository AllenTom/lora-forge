import { ChannelsKeys, DatasetItem, OriginalItem, PreProcessConfig } from '../../../types';
import { ipcRenderer } from '../base';

export const preprocessTrainingData = async (config: PreProcessConfig) => {
  return ipcRenderer.sendMessage(ChannelsKeys.preprocess, config);
};
export const interruptPreprocess = async () => {
  return ipcRenderer.sendMessage(ChannelsKeys.interruptPreprocess);
};

export const importImagesFromFolder = async (): Promise<{
  images: string[],
  folder: string,
  name: string
} | undefined> => {
  return ipcRenderer.invoke(ChannelsKeys.importImageFromFolder);
};
export const importImagesFromFiles = async (): Promise<string[] | undefined> => {
  return ipcRenderer.invoke(ChannelsKeys.importImageFromFiles);

};

export const makeCaption = async (params:{imagePaths: string[],threshold?:number,tagger:string,general_threshold: number,
  model: string,taggerId:string}) => {
  return ipcRenderer.invoke(ChannelsKeys.makeCaption, params);
}

export const interruptCaption = async () => {
  return ipcRenderer.invoke(ChannelsKeys.interruptMakeCaption);
}

export const savePreprocessImage = async (params: { base64Data: string, sourceImageFileName: string }) => {
  return ipcRenderer.invoke(ChannelsKeys.savePreprocessImage, params);
};
export const removePreprocessImage = async (hashes:string[]) => {
  return ipcRenderer.invoke(ChannelsKeys.preprocessImageRemove, hashes);
}

export const importOriginalImage = async (imagePaths:string[]):Promise<OriginalItem[]> => {
  return ipcRenderer.invoke(ChannelsKeys.importOriginImage, imagePaths);
}

export const segAnimeImages = async (datasetItems: DatasetItem[]):Promise<OriginalItem[]> => {
  return ipcRenderer.invoke(ChannelsKeys.segAnimeCharacter, { datasetItems });
}

export const segAnimeImagesInterrupt = async () => {
  return ipcRenderer.invoke(ChannelsKeys.segAnimeCharacterInterrupt);
}
