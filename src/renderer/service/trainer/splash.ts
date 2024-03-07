import { ipcRenderer } from '../base';
import { ChannelsKeys } from '../../../types';

export const openSplash = () => {
  ipcRenderer.sendMessage(ChannelsKeys.openSplash);
}
export const checkNeedInstall = async (args:{targetPath?:string}) => {
  return await ipcRenderer.invoke(ChannelsKeys.checkNeedInstall, args)
}

export const closeSplash = () => {
  ipcRenderer.sendMessage(ChannelsKeys.closeSplash);
}

export const runDoctorCheck = async () => {
  return await ipcRenderer.invoke(ChannelsKeys.startCheckDoctor);
}
