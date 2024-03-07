import { dialog, ipcMain } from 'electron';
import OpenDialogOptions = Electron.OpenDialogOptions;
import { ChannelsKeys, SelectFileDialogParam, SelectFolderDialogParam } from '../../../types';

const selectFolder = async (
  {
    title,
    defaultPath,
    multiple
  }: SelectFolderDialogParam): Promise<string[] | undefined> => {
  const props: OpenDialogOptions['properties'] = ['openDirectory', 'createDirectory'];
  if (multiple) {
    props.push('multiSelections');
  }
  const result = await dialog.showOpenDialog({
    title,
    defaultPath,
    properties: props
  });
  if (result.canceled) {
    return undefined;
  }
  return result.filePaths;
};

ipcMain.handle(ChannelsKeys.selectFolderDialog, async (event, args: SelectFolderDialogParam) => {
  return await selectFolder(args);
});
const selectFile = async (
  {
    title,
    defaultPath,
    multiple
  }: SelectFileDialogParam
): Promise<string[] | undefined> => {
  const props: OpenDialogOptions['properties'] = ['openFile'];
  if (multiple) {
    props.push('multiSelections');
  }
  const result = await dialog.showOpenDialog({
    properties: props,
    title,
    defaultPath
  });
  if (result.canceled) {
    return undefined;
  }
  return result.filePaths;
};

ipcMain.handle(ChannelsKeys.selectFileDialog, async (event, args: SelectFileDialogParam) => {
  return await selectFile(args);
});

export const isRemoteMode = () => {
  return process.env.REMOTE === '1';
};

ipcMain.handle(ChannelsKeys.getIsRemoteMode, async () => {
  return isRemoteMode();
})
