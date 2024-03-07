import { ipcRenderer } from './base';
import { ChannelsKeys } from '../../types';

export const cloneTrainRepo = async (args: {
  workDir: string
}) => {
  ipcRenderer.sendMessage(ChannelsKeys.cloneTrainRepo, args);
};
export const installTrainRepo = async (args: {
  workDir: string
}) => {
  ipcRenderer.sendMessage(ChannelsKeys.installTrainRepo, args);
};

export const openFolder = async (
  {
    path
  }: { path: string }) => {
  ipcRenderer.sendMessage(ChannelsKeys.openFolder, path);
};

