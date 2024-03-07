import { ipcRenderer } from '../base';
import { ChannelsKeys } from '../../../types';

export const openInstall = () => {
  ipcRenderer.sendMessage(ChannelsKeys.openInstall);
};

export const installDeps = (args: {
  installPath: string
}) => {
  ipcRenderer.sendMessage(ChannelsKeys.installDep, args);
};
export const getDefaultInstallPath = async () => {
  return ipcRenderer.invoke(ChannelsKeys.getDefaultInstallPath);
};

export const closeInstall = () => {
  ipcRenderer.sendMessage(ChannelsKeys.closeInstall);
};

export const setInstallDir = (args: {
  targetPath: string
}) => {
  ipcRenderer.invoke(ChannelsKeys.setInstallDir, args);
};

export const openAccelerateConfig = () => {
  ipcRenderer.sendMessage(ChannelsKeys.accelerateConfig);
}
