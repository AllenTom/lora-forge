import { ipcRenderer } from '../base';
import { ChannelsKeys } from '../../../types';

export const openEditorWindow = () => {
  ipcRenderer.sendMessage(ChannelsKeys.openEditor);
}
