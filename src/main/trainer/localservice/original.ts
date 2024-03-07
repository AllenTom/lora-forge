import { openProjectPath, readProjectMeta, updateProjectMeta, writeProjectMeta } from './project';
import path from 'path';
import fs from 'fs';
import log from 'electron-log';
import { getFileHash } from '../../utils';
import { ipcMain } from 'electron';
import { ChannelsKeys, ImportOriginalProcess, OriginalItem } from '../../../types';
import { getImagePath } from './image';
import { editorWindow } from '../../trainer';
import Jimp from 'jimp';

export const getOriginalImageFolder = () => {
  if (!openProjectPath) {
    return undefined;
  }
  const originalFolderPath = path.join(openProjectPath, 'original');
  if (!fs.existsSync(originalFolderPath)) {
    fs.mkdirSync(originalFolderPath);
  }
  return originalFolderPath;
};

export const saveToOriginalFolder = async (sourcePath: string) => {
  const originalFolderPath = getOriginalImageFolder();
  if (!originalFolderPath) {
    return;
  }
  const destPath = path.join(originalFolderPath, path.basename(sourcePath));
  await fs.promises.copyFile(sourcePath, destPath);
  return destPath;
};
export const createNewOriginalImage = async (sourcePath: string): Promise<OriginalItem | undefined> => {
  const imagePath = await saveToOriginalFolder(sourcePath);
  if (!imagePath) {
    log.error('image path not found');
    return;
  }
  const hash = await getFileHash(imagePath);
  const thumbnailPath = await makeOriginalThumbnail(imagePath);
  if (!thumbnailPath) {
    log.error('thumbnail path not found');
    return;
  }
  return {
    src: path.basename(imagePath),
    hash,
    thumbnail: path.basename(thumbnailPath)
  };

};
export const getOriginalImage = async (destPath: string) => {

};
export const makeOriginalThumbnail = async (sourcePath: string) => {
  const imagePath = getImagePath();
  if (!imagePath) {
    log.error('image path not found');
    return;
  }
  let thumbnailPath: string | undefined = path.join(imagePath, 'tnb_' + path.basename(sourcePath));
  try {
    (await Jimp.read(sourcePath))
      .resize(120, Jimp.AUTO)
      .write(thumbnailPath);
  } catch (e) {
    log.error(e);
    thumbnailPath = undefined;
  }

  return thumbnailPath;
};
export const importOriginalImage = async (sourcePaths: string[]) => {
  const meta = await readProjectMeta();
  if (!meta) {
    log.error('project meta not found on import original image');
    return;
  }
  const originalFolderPath = getOriginalImageFolder();
  if (!originalFolderPath) {
    log.error('original folder not found on import original image');
    return;
  }
  const imagePath = getImagePath();
  if (!imagePath) {
    log.error('image path not found');
    return;
  }

  let originalImages = meta.original ?? [];
  const status: ImportOriginalProcess = {
    total: sourcePaths.length,
    current: 0,
    status: 'running',
    path: '',
    name: '',
    importedImages: []
  };
  for (let sourcePath of sourcePaths) {
    // update status
    status.current++;
    status.path = sourcePath;
    status.name = path.basename(sourcePath);
    editorWindow?.webContents.send(ChannelsKeys.importImageProcessEvent, status);
    const originalItem = await createNewOriginalImage(sourcePath);
    if (!originalItem) {
      log.error('original item not found on import original image');
      continue;
    }
    originalImages = originalImages.filter(it => it.hash !== originalItem.hash);
    originalImages.push(originalItem);
    status.importedImages.push(sourcePath);
  }
  meta.original = originalImages;
  writeProjectMeta(meta);
  originalImages.forEach(it => {
    it.fileName = it.src;
    it.src = path.join(originalFolderPath, it.src);
    it.thumbnail = path.join(imagePath, it.thumbnail);
  });
  return originalImages;
};

ipcMain.handle(ChannelsKeys.importOriginImage, async (event, sourcePaths: string[]) => {
  return await importOriginalImage(sourcePaths);
});

export const loadOriginalImages = async (): Promise<OriginalItem[] | undefined> => {
  const originalFolderPath = getOriginalImageFolder();
  if (!originalFolderPath) {
    log.error('original folder not found on load original image');
    return;
  }
  const meta = await readProjectMeta();
  if (!meta) {
    log.error('project meta not found on load original image');
    return;
  }
  let files = fs.readdirSync(originalFolderPath);
  let originalImages = meta.original ?? [];
  let invalidateHashItem: string[] = [];
  let validateFiles: string[] = [];
  for (let originalImage of originalImages) {
    const imagePath = path.join(originalFolderPath, originalImage.src);
    if (!files.includes(originalImage.src)) {
      invalidateHashItem.push(originalImage.hash);
      continue;
    }
    const exactHash = await getFileHash(imagePath);
    if (exactHash !== originalImage.hash) {
      invalidateHashItem.push(originalImage.hash);
      continue;
    }
    validateFiles.push(originalImage.src);
  }
  // remove invalidate hash item
  originalImages = originalImages.filter(it => !invalidateHashItem.includes(it.hash));
  // remove unlink file
  const invalidateFile = files.filter(it => !validateFiles.includes(it));
  for (let file of invalidateFile) {
    await fs.promises.unlink(path.join(originalFolderPath, file));
  }
  updateProjectMeta({
    original: originalImages
  });
  return originalImages;
};

export const originalToRealPath = (originalItems: OriginalItem[]) => {
  const originPath = getOriginalImageFolder();
  const imagePath = getImagePath();
  if (originPath && imagePath) {
    originalItems.forEach((it) => {
      it.src = path.join(originPath, it.src);
      it.fileName = path.basename(it.src);
      it.thumbnail = path.join(imagePath, it.thumbnail);
    });
  } else {
    originalItems = [];
  }
  return originalItems;
};
