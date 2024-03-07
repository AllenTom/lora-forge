import { getNestedPretrainPath } from '../../paths';
import fs from 'fs';
import path from 'path';
import { ChannelsKeys, PretrainModel } from '../../../types';
import { ipcMain, shell } from 'electron';
const allowPretrainedModelExtensions = [
  ".ckpt",".safetensors"
]
export const getPreTrainModelList = async (): Promise<PretrainModel[]> => {
  const pretrainPath = getNestedPretrainPath();
  let item = fs.readdirSync(pretrainPath) ?? [];
  item = item.filter(it => {
    const stat = fs.statSync(path.join(pretrainPath, it));
    if (stat.isDirectory()) {
      return true;
    }
    if (stat.isFile()) {
      const ext = path.extname(it);
      return allowPretrainedModelExtensions.includes(ext);
    }
  });
  return item.map(it => {
    return {
      name: it,
      path: path.join(pretrainPath, it)
    };
  });
};
ipcMain.handle(ChannelsKeys.getPretrainModels, async (): Promise<PretrainModel[]> => {
  return getPreTrainModelList();
});
export const openPretrainModelFolder = async () => {
  const pretrainPath = getNestedPretrainPath();
  if (!fs.existsSync(pretrainPath)) {
    fs.mkdirSync(pretrainPath, { recursive: true });
  }
  await shell.openPath(pretrainPath);
};

ipcMain.handle(ChannelsKeys.openPretrainFolder, async () => {
  await openPretrainModelFolder();
});
