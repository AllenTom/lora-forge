import { getFileHash, runPythonScript, scanImageFromFolder } from '../../utils';
import { dialog, ipcMain } from 'electron';
import {
  AppConfig,
  CaptionOut,
  ChannelsKeys,
  DatasetFolder,
  DatasetItem,
  DataStoreKeys,
  LoraConfig,
  PreProcessConfig,
  PreProcessOut, ProcessOutputEvent, SegOut,
  TrainerSettings
} from '../../../types';
import * as fs from 'fs';
import path from 'path';
import { dataStore } from '../../store';
import * as os from 'os';
import { editorWindow } from '../../trainer';
import log from 'electron-log';
import { PythonShell } from 'python-shell';
import kill from 'tree-kill';
import { openProjectPath, readProjectMeta, writeProjectMeta } from './project';
import {
  getPreprocessFolder,
  linkOriginalImageToPreprocessOutput,
  loadPreprocessImages,
  preprocessImageToRealPath,
  writeCaptionHistory
} from './preprocess';
import { rimrafSync } from 'rimraf';
import { originalToRealPath } from './original';

export const getImagePath = () => {
  if (!openProjectPath) {
    return undefined;
  }
  const imageFolderPath = path.join(openProjectPath, 'image');
  if (!fs.existsSync(imageFolderPath)) {
    fs.mkdirSync(imageFolderPath);
  }
  return imageFolderPath;
};
let preprocessProcess: PythonShell | null = null;
let makeCaptionProcess: PythonShell | null = null;
let makeSegProcess: PythonShell | null = null;
const readCaption = (captionFilePath: string) => {
  const caption = fs.readFileSync(captionFilePath, 'utf-8');
  if (caption.length == 0) {
    return [];
  }
  return caption.split(',').map((it: string) => it.trim());
};
export const scanImageFiles = async (imagePath: string) => {
  const result: DatasetItem[] = [];
  const dir = fs.readdirSync(imagePath);
  const imageFiles = dir.filter((file: string) => {
    const ext = path.extname(file.toLowerCase());
    return ext === '.png' || ext === '.jpg' || ext === '.jpeg';
  });
  for (let file of imageFiles) {
    const dataItem: DatasetItem = {
      hash: await getFileHash(path.join(imagePath, file)),
      imagePath: path.join(imagePath, file),
      imageName: file
    };
    const captionFileName = file.replace(path.extname(file), '.txt');
    const captionFilePath = path.join(imagePath, captionFileName);
    if (fs.existsSync(captionFilePath)) {
      const captionTags = readCaption(captionFilePath);
      if (captionTags.length > 0) {
        dataItem.captionPath = captionFilePath;
        dataItem.captions = captionTags;
      }
    }
    result.push(dataItem);
  }
  return result;
};

const selectImageSourceFolder = async () => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result.filePaths[0];
};
export const createDataset = async ({ dataset, folders, out }: {
  dataset: DatasetItem[],
  folders: DatasetFolder[],
  out: string
}) => {
  if (fs.existsSync(out)) {
    rimrafSync(out);
  }
  for (let folder of folders) {
    const folderName = `${folder.step}_${folder.name}`;
    await fs.promises.mkdir(path.join(out, folderName), {
      recursive: true
    });
    const folderImages = dataset.filter((item: DatasetItem) => {
      return folder.images.includes(item.imagePath);
    });
    for (let item of folderImages) {
      const dest = path.join(out, folderName, path.basename(item.imagePath));
      await fs.promises.copyFile(item.imagePath, dest);
      if (item.captions) {
        const captionString = item.captions.join(',');
        const captionFilename = path.basename(item.imagePath).replace(path.extname(item.imagePath), '.txt');
        const captionFile = await fs.promises.open(path.join(out, folderName, captionFilename), 'w');
        await captionFile.writeFile(captionString);
        await captionFile.close();
      }
    }
  }
};
const preProcessImage = async (config: PreProcessConfig, {
  onStdout,
  onStderr,
  onClose
}: {
  onStdout?: (data: string) => void,
  onStderr?: (data: string) => void,
  onClose?:() => void
}) => {
  log.info('preprocessImage');
  log.info(config);
  if (preprocessProcess) {
    log.info('preprocess already running');
    return;
  }
  const inputJson: any = {};
  if (config.folders) {
    inputJson['folders'] = config.folders;
  }
  if (config.files) {
    inputJson['files'] = config.files;
  }

  const args = [
    '--json_out',
    '--json_input_base64',
    (new Buffer(JSON.stringify(inputJson))).toString('base64'),
    '--dest',
    config.destPath,
    '--output_detail'
  ];
  if (config.width) {
    args.push('--width');
    args.push(config.width.toString());
  }
  if (config.height) {
    args.push('--height');
    args.push(config.height.toString());
  }
  if (config.danbooruCaption) {
    args.push('--caption_deepbooru');
  }
  if (config.clipCaption) {
    args.push('--caption_clip');
  }
  if (config.blipCaption) {
    args.push('--caption');
  }
  if (config.wdCaption) {
    args.push('--caption_wd');
    if (config.wdModelName) {
      args.push('--wd_model_name');
      args.push(config.wdModelName);
    }
    if (config.wdGeneralThreshold) {
      args.push('--wd_general_threshold');
      args.push(config.wdGeneralThreshold.toString());
    }
  }
  if (config.clip2Caption) {
    args.push('--caption_clip2');
  }
  if (config.faceFocus) {
    args.push('--focal_crop');
  }
  if (config.focusAnimeFace) {
    args.push('--anime_face');
    args.push('--anime_face_ratio', config.focusAnimeFaceRatio.toString());
  }
  if (config.focusAnimeBody) {
    args.push('--anime_person');
    args.push('--anime_person_ratio', config.focusAnimeBodyRatio.toString());
  }
  if (config.focusAnimeHalfBody) {
    args.push('--anime_half');
    args.push('--anime_half_ratio', config.focusAnimeHalfBodyRatio.toString());
  }
  if (config.focusToTop) {
    args.push('--to_anime_body_top');
  }
  if (config.flip) {
    args.push('--flip');
  }
  log.info(args)
  const trainConfig: LoraConfig = dataStore.get(DataStoreKeys.trainerConfig);
  if (!trainConfig.preprocessRepo) {
    return;
  }
  let envs: { [key: string]: string } = {};
  const savedConfig: TrainerSettings = dataStore.get(DataStoreKeys.trainerSetting);
  if (savedConfig?.proxy) {
    envs['http_proxy'] = savedConfig.proxy
    envs['https_proxy'] = savedConfig.proxy
  }
  let pythonExec = path.join(trainConfig.preprocessRepo, '\\venv\\Scripts\\python.exe');
  const trainSettings: TrainerSettings = dataStore.get(DataStoreKeys.trainerSetting);
  if (trainSettings && trainSettings.trainerPythonPath && fs.existsSync(trainSettings.trainerPythonPath)) {
    pythonExec = path.join(trainSettings.trainerPythonPath, 'python.exe');
  }

  if (os.platform() === 'darwin') {
    pythonExec = path.join(trainConfig.preprocessRepo, '/venv/bin/python');
  }

  const scriptPath = path.join(trainConfig.preprocessRepo, 'preprocess_cli.py');
  const cwd = trainConfig.preprocessRepo;

  log.info('preprocess', args, cwd, pythonExec, scriptPath, envs);
  // print full command
  log.info(`exec command: ${pythonExec} ${scriptPath} ${args.join(' ')}`);
  const process = runPythonScript({
    pythonExec,
    scriptPath,
    args: args as any,
    workingDir: cwd,
    onStdout,
    onStdError: onStderr,
    env: envs,
    onClose: () => {
      preprocessProcess = null;
      onClose?.()
    }
  });
  preprocessProcess = process;
  return process;
};

export const makePreprocess = async (config: PreProcessConfig):Promise<void> => {
  await preProcessImage(config, {
    onStdout: async (data: string) => {
      let message: PreProcessOut | undefined;
      log.info(data);
      try {
        message = JSON.parse(data);
        // event.sender.send('preprocess-out', JSON.parse(data));
      } catch (e) {
        console.log(e);
      }
      if (!message) {
        return;
      }
      if (message.event === 'preprocess_done') {
        const outs: Array<{
          src: string,
          dest: string
        }> = message.vars;
        const result = await linkOriginalImageToPreprocessOutput(outs.map(it => ({
          sourcePath: it.src,
          destPath: it.dest
        })));
        if (result) {
          const original = originalToRealPath(result.original);
          const preItems = await loadPreprocessImages(original) ?? [];
          editorWindow?.webContents.send(ChannelsKeys.preprocessDone, {
            original,
            preprocess: preprocessImageToRealPath(preItems)
          });
        }
      }
      editorWindow?.webContents.send(ChannelsKeys.preprocessOut, message);
    },
    onStderr: async (data: string) => {
      editorWindow?.webContents.send(ChannelsKeys.preprocessError, data);
    },
    onClose:() => {
      editorWindow?.webContents.send(ChannelsKeys.preprocessExit);
    }
  });
}


ipcMain.on(ChannelsKeys.interruptPreprocess, async (event) => {
  if (preprocessProcess) {
    kill(preprocessProcess.childProcess.pid!, 'SIGINT', function(error) {
      if (error) {
        log.error(error);
        return;
      }
      log.info(`preprocess process ${preprocessProcess?.childProcess.pid!} killed`);
    });
  }
});

ipcMain.handle(ChannelsKeys.loadTagLibrary, async (event, {
  datasetPath
}: {
  datasetPath: string
}) => {
  return scanImageFiles(datasetPath);
});
const saveAndCreateDataset = async ({ dataset, folders, out }: {
  dataset: DatasetItem[],
  folders: DatasetFolder[],
  out: string
}) => {
  const meta = readProjectMeta();
  if (!meta) {
    log.error('project meta not found on save and create dataset');
    return;
  }
  writeProjectMeta({
    ...meta,
    dataset: folders
  });
  await createDataset({ dataset, folders, out });
};
ipcMain.handle(ChannelsKeys.createDataset, async (event, { dataset, folders, out }: {
  dataset: DatasetItem[],
  folders: DatasetFolder[],
  out: string
}) => {
  return saveAndCreateDataset({ dataset, folders, out });
});

export const loadDataset = async ({ datasetPath }: { datasetPath: string }) => {
  if (!fs.existsSync(datasetPath)) {
    fs.mkdirSync(datasetPath, { recursive: true });
    return [];
  }
  const folders = fs.readdirSync(datasetPath);
  const result: DatasetFolder[] = [];
  for (let folder of folders) {
    const folderPath = path.join(datasetPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) {
      continue;
    }
    const dirItems = fs.readdirSync(folderPath);
    const imageFiles = dirItems.filter((file: string) => {
      const ext = path.extname(file.toLowerCase());
      return ext === '.png' || ext === '.jpg' || ext === '.jpeg';
    });
    const parts = folder.split('_');
    const step = parseInt(parts[0]);
    const name = parts[1];
    result.push({
      step,
      name,
      images: imageFiles.map(it => path.join(folderPath, it))
    });
  }
  return result;
};


ipcMain.handle(ChannelsKeys.loadDataset, async (event, { datasetPath }: { datasetPath: string }) => {
  return loadDataset({ datasetPath });
});


export const selectImageFolder = async (): Promise<{
  images: string[],
  folder: string,
  name: string
} | undefined> => {
  const result = await dialog.showOpenDialog(editorWindow!, {
    properties: ['openDirectory']
  });
  if (result.canceled) {
    return;
  }
  if (result.filePaths.length === 0) {
    return;
  }
  const folderPath = result.filePaths[0];
  const images = await scanImageFromFolder(folderPath);
  return {
    images: images.map(it => path.join(folderPath, it)),
    folder: folderPath,
    name: path.basename(folderPath)
  };
};
ipcMain.handle(ChannelsKeys.importImageFromFolder, async (event) => {
  return selectImageFolder();
});
export const selectImageFiles = async (): Promise<string[] | undefined> => {
  const result = await dialog.showOpenDialog(editorWindow!, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'png', 'jpeg'] }
    ]
  });
  if (result.canceled) {
    return;
  }
  if (result.filePaths.length === 0) {
    return;
  }
  return result.filePaths;
};


ipcMain.handle(ChannelsKeys.importImageFromFiles, async (event) => {
  return selectImageFiles();
});

export const makeDeepDanbooruCaption = async (params: {
  imagePaths: string[],
  threshold?: number,
  tagger: string,
  general_threshold: number,
  model: string
}, { onStdout, onStderr }: {
  onStdout?: (data: string) => void,
  onStderr?: (data: string) => void
}): Promise<PythonShell | undefined> => {
  log.info('makeDeepDanbooruCaption');
  const inputJson: any = {};
  if (params.imagePaths) {
    inputJson['files'] = params.imagePaths;
  }
  const args = [
    '--input_base64',
    (new Buffer(JSON.stringify(inputJson))).toString('base64'),
    '--per',
    '--with_rank',
    '--no_result'
  ];
  if (params.tagger === 'deepbooru') {
    if (params.threshold) {
      args.push('--threshold');
      args.push(params.threshold.toString());
    }
  }
  if (params.tagger === 'wd14') {
    if (params.general_threshold) {
      args.push('--general_threshold');
      args.push(params.general_threshold.toString());
    }
    if (params.model) {
      args.push('--model');
      args.push(params.model);
    }
  }

  const trainConfig: LoraConfig = dataStore.get(DataStoreKeys.trainerConfig);
  if (!trainConfig.preprocessRepo) {
    return undefined;
  }
  let envs: { [key: string]: string } = {};
  const savedConfig: TrainerSettings = dataStore.get(DataStoreKeys.trainerSetting);
  if (savedConfig?.proxy) {
    envs['http_proxy'] = savedConfig.proxy
    envs['https_proxy'] = savedConfig.proxy
  }
  let pythonExec = path.join(trainConfig.preprocessRepo, '\\venv\\Scripts\\python.exe');
  const trainSettings: TrainerSettings = dataStore.get(DataStoreKeys.trainerSetting);
  if (trainSettings && trainSettings.trainerPythonPath && fs.existsSync(trainSettings.trainerPythonPath)) {
    pythonExec = path.join(trainSettings.trainerPythonPath, 'python.exe');
  }
  if (os.platform() === 'darwin') {
    pythonExec = path.join(trainConfig.preprocessRepo, '/venv/bin/python');
  }
  let scriptName = 'deepbooru_cli.py';
  if (params.tagger === 'clip') {
    scriptName = 'clip_cli.py';
  }
  if (params.tagger === 'wd14') {
    scriptName = 'wd14_cli.py';
  }
  if (params.tagger === 'clip2') {
    scriptName = 'clip_cli2.py';
  }
  if (params.tagger === 'blip') {
    scriptName = 'blip_cli.py';
  }

  const scriptPath = path.join(trainConfig.preprocessRepo, scriptName);
  const cwd = trainConfig.preprocessRepo;
  const process = runPythonScript({
    pythonExec,
    scriptPath,
    args: args as any,
    workingDir: cwd,
    onStdout,
    onStdError: onStderr,
    env: envs,
    onClose: () => {
      makeCaptionProcess = null;
    }
  });
  makeCaptionProcess = process;
  return process;
};

ipcMain.handle(ChannelsKeys.makeCaption, async (event, params: {
  imagePaths: string[],
  threshold?: number,
  general_threshold: number,
  model: string,
  tagger: string,
  taggerId: string
}) => {
  let count = 0;
  await makeDeepDanbooruCaption(params, {
    onStdout: async (data: string) => {
      try {
        log.info(data);
        const pv = data.trim();
        const raw: CaptionOut = JSON.parse(data.trim());
        if (raw.err) {
          editorWindow?.webContents.send(ChannelsKeys.captionError, raw.err);
          log.error(raw.err);
          return;
        }
        if (raw.tags && raw.filename) {
          const tagHistory = raw.tags.map(it => {
            return {
              name: it.tag,
              rank: it.rank,
              taggerId: params.taggerId,
              createdAt: new Date().toISOString()
            };
          });
          const newHistory = await writeCaptionHistory(
            path.basename(raw.filename),
            tagHistory
          );
          editorWindow?.webContents.send(ChannelsKeys.captionHistoryUpdate, raw.filename, newHistory);
        }
        editorWindow?.webContents.send(ChannelsKeys.captionOut, raw);
        count++;
        if (count === params.imagePaths.length) {
          editorWindow?.webContents.send(ChannelsKeys.captionDone);
        }
      } catch (e) {
        log.error(e);
      }
    },
    onStderr: async (data: string) => {
      log.error(data);
      editorWindow?.webContents.send(ChannelsKeys.captionStdError, data);
    }
  });
});

ipcMain.handle(ChannelsKeys.interruptMakeCaption, async (event) => {
  if (makeCaptionProcess) {
    kill(makeCaptionProcess.childProcess.pid!, 'SIGINT', function(error) {
      if (error) {
        log.error(error);
        return;
      }
      log.info(`make caption process ${makeCaptionProcess?.childProcess.pid!} killed`);
    });
  }
});

const makeSegAnimeCharacter = (params: { imagePaths: string[] }, { onStdout, onStderr,onClose }: {
  onStdout?: (data: string) => void,
  onStderr?: (data: string) => void,
  onClose?: () => void
}) => {
  const preprocessPath = getPreprocessFolder();
  if (!preprocessPath) {
    return;
  }
  log.info('makeSegAnimeCharacter');
  const inputJson: any = {};
  if (params.imagePaths) {
    inputJson['files'] = params.imagePaths;
  }
  const args = [
    '--json_out',
    '--json_input_base64',
    (new Buffer(JSON.stringify(inputJson))).toString('base64'),
    '--out',
    preprocessPath
  ];
  const trainConfig: LoraConfig = dataStore.get(DataStoreKeys.trainerConfig);
  if (!trainConfig.preprocessRepo) {
    return undefined;
  }
  let envs: { [key: string]: string } = {};
  const savedConfig: TrainerSettings = dataStore.get(DataStoreKeys.trainerSetting);
  if (savedConfig?.proxy) {
    envs['http_proxy'] = savedConfig.proxy
    envs['https_proxy'] = savedConfig.proxy
  }
  let pythonExec = path.join(trainConfig.preprocessRepo, '\\venv\\Scripts\\python.exe');
  const trainSettings: TrainerSettings = dataStore.get(DataStoreKeys.trainerSetting);
  if (trainSettings && trainSettings.trainerPythonPath && fs.existsSync(trainSettings.trainerPythonPath)) {
    pythonExec = path.join(trainSettings.trainerPythonPath, 'python.exe');
  }
  if (os.platform() === 'darwin') {
    pythonExec = path.join(trainConfig.preprocessRepo, '/venv/bin/python');
  }
  let scriptName = 'aniseg_cli.py';
  const scriptPath = path.join(trainConfig.preprocessRepo, scriptName);
  const cwd = trainConfig.preprocessRepo;
  const process = runPythonScript({
    pythonExec,
    scriptPath,
    args: args as any,
    workingDir: cwd,
    onStdout,
    env: envs,
    onClose: () => {
      makeSegProcess = null;
      onClose?.();
    },
    onStdError: onStderr
  });
  makeSegProcess = process;
  return process;
};
ipcMain.handle(ChannelsKeys.segAnimeCharacter, async (event, params: { datasetItems: DatasetItem[] }) => {
  const imagePaths = params.datasetItems.map(it => it.imagePath);
  makeSegAnimeCharacter({ imagePaths }, {
      onStdout: async (data: string) => {
        try {
          log.info(data);
          const pv = data.trim();
          const raw: ProcessOutputEvent<SegOut> = JSON.parse(data.trim());
          if (raw.err) {
            editorWindow?.webContents.send(ChannelsKeys.segAnimeCharacterErr, raw.err);
            log.error(raw.err);
            return;
          }
          if (raw.vars && raw.vars.output && raw.vars.path) {
            const item = params.datasetItems.find(it => it.imagePath === raw.vars!.path);
            if (item && item.originalPath) {
              const result = await linkOriginalImageToPreprocessOutput([{
                sourcePath: item.originalPath,
                destPath: raw.vars.output
              }]);
              if (result) {
                const original = originalToRealPath(result.original);
                const preItems = await loadPreprocessImages(original) ?? [];
                editorWindow?.webContents.send(ChannelsKeys.preprocessDone, {
                  original,
                  preprocess: preprocessImageToRealPath(preItems)
                });
              }
            }
            editorWindow?.webContents.send(ChannelsKeys.segAnimeCharacterOut, raw);
          }
        } catch (e) {
          log.error(e);
        }
      },
      onStderr: async (data: string) => {
        editorWindow?.webContents.send(ChannelsKeys.segAnimeCharacterStdErr, data);
      },
    }
  );
});
ipcMain.handle(ChannelsKeys.segAnimeCharacterInterrupt, async (event) => {
  if (makeSegProcess) {
    kill(makeSegProcess.childProcess.pid!, 'SIGINT', function(error) {
      if (error) {
        log.error(error);
        return;
      }
      log.info(`make makeSegProcess process ${makeCaptionProcess?.childProcess.pid!} killed`);
    });
  }
});
