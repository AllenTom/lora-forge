import {
  CaptionHistory,
  ChannelsKeys,
  DatasetItem,
  NewPreprocessImageParam,
  OriginalItem,
  ProjectMeta
} from '../../../types';
import { openProjectPath, readProjectMeta, updateProjectMeta, writeProjectMeta } from './project';
import log from 'electron-log';
import { getFileHash } from '../../utils';
import { createNewOriginalImage, getOriginalImageFolder } from './original';
import path from 'path';
import fs from 'fs';
import { randomString } from '../../../renderer/utils/string';
import { ipcMain } from 'electron';
import { editorWindow } from '../../trainer';
import { scanImageFiles } from './image';
import { diff, merge } from 'radash';
import Jimp from 'jimp';

export const getPreprocessFolder = () => {
  if (!openProjectPath) {
    return undefined;
  }
  const preprocessFolderPath = path.join(openProjectPath, 'preprocess');
  if (!fs.existsSync(preprocessFolderPath)) {
    fs.mkdirSync(preprocessFolderPath);
  }
  return preprocessFolderPath;
};
export const linkOriginalImageToPreprocessOutput = async (outputs: Array<{ sourcePath: string, destPath: string }>) => {
  const meta: ProjectMeta | undefined = readProjectMeta();
  if (!meta) {
    log.error('project meta not found on link original image to preprocess output');
    return;
  }
  let preprocessLink = meta.preprocess ?? [];
  let originalItems = meta.original ?? [];
  for (let output of outputs) {
    const sourceHash = await getFileHash(output.sourcePath);
    let originalItem = originalItems.find(it => it.hash === sourceHash);
    if (!originalItem) {
      originalItem = await createNewOriginalImage(output.sourcePath);
    }
    if (!originalItem) {
      log.error('original item not found');
      continue;
    }
    originalItems = originalItems.filter(it => it.hash !== originalItem!.hash);
    originalItems.push(originalItem);
    preprocessLink = preprocessLink.filter((it) => {
      return it.dest !== output.destPath;
    });
    const fileHash = await getFileHash(output.destPath);
    preprocessLink.push({
      hash: fileHash,
      src: originalItem.hash,
      dest: path.basename(output.destPath)
    });
  }
  meta.preprocess = preprocessLink;
  meta.original = originalItems;
  writeProjectMeta(meta);
  return { preprocess: meta.preprocess, original: originalItems };
};

export const newPreprocessImageWithBase64 = async (
  {
    base64Data, sourceImageFileName
  }: NewPreprocessImageParam) => {
  const projectMeta = readProjectMeta();
  if (!projectMeta) {
    log.error('project meta not found');
    return;
  }
  const base64DataRegex = /^data:image\/png;base64,/;
  if (!base64DataRegex.test(base64Data)) {
    log.error('invalid base64 data');
    return;
  }
  // get raw
  const rawBase64Data = base64Data.replace(base64DataRegex, '');
  const originalFolder = getOriginalImageFolder();
  if (!originalFolder) {
    log.error('original folder not found');
    return;
  }
  const preprocessFolder = getPreprocessFolder();
  if (!preprocessFolder) {
    log.error('preprocess folder not found');
    return;
  }
  const sourcePath = path.join(originalFolder, sourceImageFileName);
  const sourceHash = await getFileHash(sourcePath);

  let outputName = `${randomString(4)}_${sourceHash}`;
  while (fs.existsSync(path.join(preprocessFolder, outputName))) {
    outputName = `${randomString(4)}_${sourceHash}`;
  }


  const savePath = path.join(preprocessFolder, outputName + '.png');
  const tempPath = path.join(preprocessFolder, outputName + '_tmp' + '.png');
  await fs.promises.writeFile(tempPath, rawBase64Data, { encoding: 'base64' });


  (await Jimp.read(tempPath))
    .resize(projectMeta.params.width, projectMeta.params.height)
    .write(savePath);

  await fs.promises.unlink(tempPath);

  const imageHash = await getFileHash(savePath);
  // write caption file
  const captionPath = path.join(preprocessFolder, `${outputName}.txt`);
  const captionFile = await fs.promises.open(captionPath, 'w');
  await captionFile.writeFile('');
  await captionFile.close();
  const datasetItem: DatasetItem = {
    hash: imageHash,
    imagePath: savePath,
    captionPath: captionPath,
    captions: [],
    originalPath: sourcePath,
    imageName: outputName + '.png'
  };
  editorWindow?.webContents.send(ChannelsKeys.newPreprocessImageFile, datasetItem);
  await linkOriginalImageToPreprocessOutput([{ sourcePath, destPath: savePath }]);
  return;
};

ipcMain.handle(ChannelsKeys.savePreprocessImage, (event, param: NewPreprocessImageParam) => {
  return newPreprocessImageWithBase64(param);
});


const deletePreprocessImage = async (imageHashes: string[]) => {
  const preprocessFolder = getPreprocessFolder();
  if (!preprocessFolder) {
    log.error('preprocess folder not found');
    return;
  }
  const meta = readProjectMeta();
  if (!meta) {
    log.error('project meta not found');
    return;
  }
  const deletedHashes = [];
  for (let imageHash of imageHashes) {
    let preprocessLink = meta.preprocess ?? [];
    const image = preprocessLink.find(it => it.hash === imageHash);
    if (!image) {
      log.error('image not found', imageHash);
      continue;
    }
    preprocessLink = preprocessLink.filter(it => {
      return it.hash !== imageHash;
    });
    meta.preprocess = preprocessLink;
    for (let datasetFolder of meta.dataset) {
      datasetFolder.images = datasetFolder.images.filter(it => it !== imageHash);
    }
    writeProjectMeta(meta);
    const imagePath = path.join(preprocessFolder, image.dest);
    if (fs.existsSync(imagePath)) {
      await fs.promises.unlink(imagePath);
    }
    const captionPath = path.join(preprocessFolder, image.dest.replace(path.extname(image.dest), '.txt'));
    if (fs.existsSync(captionPath)) {
      await fs.promises.unlink(captionPath);
    }
    deletedHashes.push(imageHash);
  }
  editorWindow?.webContents.send(ChannelsKeys.preprocessImageRemoveEvent, deletedHashes);
  return;
};

ipcMain.handle(ChannelsKeys.preprocessImageRemove, (event, imageHashes: string[]) => {
  return deletePreprocessImage(imageHashes);
});

export const loadPreprocessImages = async (originalImages: OriginalItem[]): Promise<DatasetItem[] | undefined> => {
  if (!openProjectPath) {
    log.error('project not opened');
    return;
  }
  const preprocessPath = path.join(openProjectPath, 'preprocess');
  if (!fs.existsSync(preprocessPath)) {
    fs.mkdirSync(preprocessPath, { recursive: true });
  }
  const imageItems: DatasetItem[] = await scanImageFiles(preprocessPath);

  const meta = readProjectMeta();
  if (!meta) {
    return;
  }
  // set preprocess meta
  let savePreprocess = meta.preprocess ?? [];
  let validateItems: DatasetItem[] = [];
  let invalidItemHashes: string[] = [];
  for (let preprocessItem of savePreprocess) {
    const isExist = imageItems.find((item) => item.imageName === preprocessItem.dest);
    // must exist
    if (!isExist) {
      invalidItemHashes.push(preprocessItem.hash);
      continue;
    }
    // must match hash
    if (isExist.hash !== preprocessItem.hash) {
      invalidItemHashes.push(preprocessItem.hash);
      continue;
    }
    // must match original
    if (!isExist.originalPath) {
      const originalItem = originalImages.find(it => it.hash === preprocessItem.src);
      if (!originalItem) {
        invalidItemHashes.push(preprocessItem.hash);
        continue;
      }
    }
    validateItems.push(isExist);
  }
  savePreprocess = savePreprocess.filter(it => !invalidItemHashes.includes(it.hash));
  updateProjectMeta({
    preprocess: savePreprocess
  });

  // remove invalid item
  const itemToRemove = diff(imageItems, validateItems, f => f.hash);
  for (let datasetItem of itemToRemove) {
    if (fs.existsSync(datasetItem.imagePath)) {
      await fs.promises.unlink(datasetItem.imagePath);
    }
    if (datasetItem.captionPath) {
      await fs.promises.unlink(datasetItem.captionPath);
    }
  }

  return savePreprocess.map(it => {
    const scannedItem = imageItems.find(item => item.imageName === it.dest);
    const source = originalImages.find(item => item.hash === it.src);
    return {
      hash: it.hash,
      imagePath: scannedItem!.imagePath,
      captionPath: scannedItem!.captionPath,
      captions: scannedItem!.captions,
      originalPath: source?.src,
      imageName: it.dest,
      captionHistory: it.captionHistory
    };
  });
};

export const writeCaptionHistory = async (filename: string, tagHistory: CaptionHistory[]): Promise<CaptionHistory[] | undefined> => {
  const meta = readProjectMeta();
  if (!meta) {
    log.error('project meta not found');
    return undefined;
  }
  let newHistory: CaptionHistory[] | undefined = undefined;
  const newPreprocessItem = meta.preprocess.map(it => {
    if (it.dest === filename) {
      let captionHistory = it.captionHistory ?? [];
      for (let item of tagHistory) {
        captionHistory = captionHistory.filter(it => it.name !== item.name || it.taggerId !== item.taggerId);
        captionHistory.push(item);
      }
      newHistory = captionHistory;
      return {
        ...it,
        captionHistory
      };
    }
    return it;
  });
  updateProjectMeta({
    preprocess: newPreprocessItem
  });
  return newHistory;
};
export const preprocessImageToRealPath = (items:DatasetItem[])  => {
  const preprocessPath = getPreprocessFolder()
  if (!preprocessPath) {
    return [];
  }
  items.forEach((it) => {
    it.imagePath = path.join(preprocessPath, it.imageName);
  });
  return items
}
