import { ChannelsKeys, SelectFolderDialogParam } from '../../../types';
import { ipcRenderer } from '../base';

export const selectFolderDialog = async (args:SelectFolderDialogParam) => {
    return await ipcRenderer.invoke(ChannelsKeys.selectFolderDialog, args);
}

export const selectFileDialog = async (args:SelectFolderDialogParam) => {
    return await ipcRenderer.invoke(ChannelsKeys.selectFileDialog, args);
}

export const getIsRemoteMode = async () => {
    return await ipcRenderer.invoke(ChannelsKeys.getIsRemoteMode);
}
