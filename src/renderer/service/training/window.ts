import { ipcRenderer } from '../base';
import { ChannelsKeys } from '../../../types';

export const resizeWindow = () => {
  ipcRenderer.sendMessage(ChannelsKeys.trainerWindowResize)
}

export const closeWindow = () => {
  ipcRenderer.sendMessage(ChannelsKeys.trainWindowClose)
}
export const minimizeWindow = () => {
  ipcRenderer.sendMessage(ChannelsKeys.trainerWindowHide)
}
