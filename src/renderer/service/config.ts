import { ipcRenderer } from './base';
import { ChannelsKeys } from '../../types';

export const saveConfig = ({ key, value }: { key: string; value: any }) => {
  ipcRenderer.sendMessage(ChannelsKeys.saveConfig, key, value);
};
export const readConfig = async ({ key }: { key: string }): Promise<any> => {
  console.log(ipcRenderer);
  return ipcRenderer.invoke(ChannelsKeys.readConfig, key);
};
export const selectFolder = async (args: { title: string,hasDirname?:boolean }) => {
  return ipcRenderer.invoke(ChannelsKeys.selectFolder, args);
}

export const selectMultipleFile = async ({ title }: { title: string }) => {
  return ipcRenderer.invoke(ChannelsKeys.selectFiles, title);
}

