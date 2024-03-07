import path from 'path';
import fs from 'fs';
import { ipcMain, shell } from 'electron';
import { editorWindow } from '../../trainer';
import {
  AppConfig,
  ChannelsKeys,
  DataStoreKeys,
  ImageGenerateOutVars,
  LoraConfig,
  LoraOutputModel,
  ProcessOutputEvent,
  SaveModel,
  SdModel,
  Text2ImageOptions,
  TrainConfig,
  TrainerSettings
} from '../../../types';
import { openProjectPath, readProjectMeta, writeProjectMeta } from './project';
import { replaceFileExtension, runPythonScript } from '../../utils';
import { dataStore } from '../../store';
import log from 'electron-log';
import os from 'os';
import { PythonShell } from 'python-shell';
import kill from 'tree-kill';

let text2ImageProcess: PythonShell | null = null;
export const generateLoraImage = async ({ loraModelPath, props, lora = 1 }: {
  loraModelPath: string,
  props?: any,
  lora?: number
}) => {
  let generateProps = props;
  if (!generateProps) {
    generateProps = await getPreviewProps();
  }
  if (!generateProps) {
    log.error('no preview props');
    return;
  }
  // TODO add preview image on run
  generateText2ImageWithLora({
    loraModelPath,
    options: generateProps,
    lora,
    onStdout: async (data) => {

    },
    onStderr: (data) => {

    }
  });
};


export const onLoraSave = async (
  {
    savePath
  }: {
    savePath: string
  }) => {
  const loraModel: LoraOutputModel = {
    name: path.basename(savePath, path.extname(savePath)),
    fileName: path.basename(savePath),
    path: savePath,
    preview:[]
  };
  log.info(`save lora model to ${savePath}`);
  // save as to meta
  const meta = readProjectMeta();
  if (meta) {
    const newModels = meta.models.filter((model) => {
      return model.path !== savePath;
    });
    newModels.push({
      name: loraModel.fileName,
      path: loraModel.path,
      previews:[]
    });
    writeProjectMeta({
      ...meta,
      models: newModels
    });
  } else {
    log.error('no meta');
  }
  // send to the renderer process
  log.info('send lora-saved');
  editorWindow?.webContents.send('lora-saved', loraModel);
  await generateLoraImage({ loraModelPath: savePath });
};

const saveBase64Image = async (base64Img: string, savePath: string) => {
  const buffer = Buffer.from(base64Img, 'base64');
  await fs.promises.writeFile(savePath, buffer);
  return;
};
export const getModelImagePath = async () => {
  if (!openProjectPath) {
    return;
  }
  const imagesPath = path.join(openProjectPath, 'image');
  if (!fs.existsSync(imagesPath)) {
    fs.mkdirSync(imagesPath);
  }
  return imagesPath;
};
export const linkImageWithPathToModel = async (imagePath: string, modelPath: string, props: any) => {
  const projectMeta = await readProjectMeta();
  if (!projectMeta) {
    return;
  }
  const model = projectMeta.models.find((model) => {
    return model.path === modelPath;
  });
  if (!model) {
    return;
  }
  const imageFilename = path.basename(imagePath);
  let updatedModel = undefined;
  const newModels = projectMeta.models.map((model) => {
    if (model.path === modelPath) {
      updatedModel = {
        ...model,
        previews:[
          ...(model.previews ?? []),
          {
            imgPath: imageFilename,
            props
          }
        ]
      };
      return updatedModel;
    }
    return model;
  });
  writeProjectMeta({
    ...projectMeta,
    models: newModels
  });
  return updatedModel;
};
export const linkImageToModel = async (imageBase64: string, modelPath: string, props: any) => {
  const projectMeta = await readProjectMeta();
  if (!projectMeta) {
    return;
  }
  const model = projectMeta.models.find((model) => {
    return model.path === modelPath;
  });
  if (!model) {
    return;
  }
  const imagesPath = await getModelImagePath();
  if (!imagesPath) {
    return;
  }
  const imageFilename = replaceFileExtension(model.name, 'jpg');
  await saveBase64Image(imageBase64, path.join(imagesPath, imageFilename));
  const newModels = projectMeta.models.map((model) => {
    if (model.path === modelPath) {
      return {
        ...model,
        previews:[
          ...(model.previews ?? []),
          {
            imgPath: imageFilename,
            props
          }
        ]
      };
    }
    return model;
  });
  writeProjectMeta({
    ...projectMeta,
    models: newModels
  });
  return imageFilename;
};
export const loraModelToRealPath = async (models: SaveModel[]):Promise<LoraOutputModel[]> => {
  const imagesPath = await getModelImagePath();
  if (!imagesPath) {
    return [];
  }
  return models.map((model) => {
    return {
      name: path.basename(model.name, path.extname(model.name)),
      fileName: model.name,
      path: model.path,
      preview:(model.previews ?? []).map(it => {
        return {
          outImage: it.imgPath ? path.join(imagesPath, it.imgPath) : undefined,
          props: it.props,
          modelName: path.basename(it.props.sdmodel)
        }
      })
    };
  });
};
export const loadModel = async (): Promise<LoraOutputModel[]> => {
  if (!openProjectPath) {
    return [];
  }

  const projectMeta = readProjectMeta();
  if (!projectMeta) {
    return [];
  }
  const imagesPath = await getModelImagePath();
  if (!imagesPath) {
    return [];
  }
  return loraModelToRealPath(projectMeta.models);
};

export const getTrainConfigList = async (): Promise<TrainConfig[]> => {
  const projectMeta = await readProjectMeta();
  if (!projectMeta) {
    return [];
  }
  return projectMeta.trainConfigs;
};


export const saveTrainConfig = async (trainConfig: TrainConfig) => {
  const projectMeta = await readProjectMeta();
  if (!projectMeta) {
    return;
  }
  const isExistOld = projectMeta.trainConfigs.find((config) => {
    return config.id === trainConfig.id;
  });
  if (!isExistOld) {
    projectMeta.trainConfigs.push(trainConfig);
  } else {
    projectMeta.trainConfigs = projectMeta.trainConfigs.map((config) => {
      if (config.id === trainConfig.id) {
        return {
          ...config,
          ...trainConfig
        };
      }
      return config;
    });
  }
  await writeProjectMeta(projectMeta);
};

ipcMain.handle(ChannelsKeys.saveTrainConfig, async (event, arg) => {
  await saveTrainConfig(arg);
  return await getTrainConfigList();
});

export const deleteTrainConfig = async (id: string) => {
  const projectMeta = await readProjectMeta();
  if (!projectMeta) {
    return;
  }
  projectMeta.trainConfigs = projectMeta.trainConfigs.filter((config) => {
    return config.id !== id;
  });
  await writeProjectMeta(projectMeta);
};
ipcMain.handle(ChannelsKeys.deleteTrainConfig, async (event, id) => {
  await deleteTrainConfig(id);
  return await getTrainConfigList();
});


export const savePreviewProps = async (previewProps: any) => {
  const projectMeta = await readProjectMeta();
  if (!projectMeta) {
    return;
  }
  projectMeta.previewProps = previewProps;
  await writeProjectMeta(projectMeta);
};
ipcMain.handle(ChannelsKeys.savePreviewProps, async (event, arg) => {
  await savePreviewProps(arg);
  return await getTrainConfigList();
});

export const getPreviewProps = async () => {
  const projectMeta = await readProjectMeta();
  if (!projectMeta) {
    return;
  }
  return projectMeta.previewProps;
};
ipcMain.handle(ChannelsKeys.getPreviewProps, async (event, arg) => {
  return await getPreviewProps();
});

export const deleteModel = async (modelPath: string) => {
  const projectMeta = await readProjectMeta();
  if (!projectMeta) {
    return;
  }
  const newModels = projectMeta.models.filter((model) => {
    return model.path !== modelPath;
  });
  writeProjectMeta({
    ...projectMeta,
    models: newModels
  });
  fs.unlinkSync(modelPath);
};

ipcMain.handle(ChannelsKeys.loraDeleteModel, async (event, modelPath) => {
  await deleteModel(modelPath);
  return await loadModel();
});

export const copyFile = async (src: string, dest: string) => {
  await fs.copyFileSync(src, dest);
};
ipcMain.handle(ChannelsKeys.loraExportModel, async (event, src, dest) => {
  const modelDest = path.join(dest, path.basename(src));
  if (!fs.existsSync(dest)) {
    await copyFile(src, modelDest);
  }
});
const generateText2ImageWithLora = async (
  {
    loraModelPath,
    options,
    lora,
    onStdout,
    onStderr,
    onClose
  }: {
    loraModelPath: string,
    options: Text2ImageOptions,
    lora: number,
    onStdout: (data: string) => void,
    onStderr: (data: string) => void,
    onClose?: () => void
  }
) => {
  log.info('text2image');
  const trainConfig: LoraConfig = dataStore.get(DataStoreKeys.trainerConfig);
  if (!trainConfig.preprocessRepo) {
    return;
  }
  const imagesPath = await getModelImagePath();
  if (!imagesPath) {
    log.error('no images path');
    return;
  }

  const args = [
    '--json_out',
    '--outdir',
    imagesPath
  ];
  let prompt = ""
  if (options.prompt) {
    prompt = options.prompt;
  }
  if (options.negative_prompt) {
    prompt += " --n " + options.negative_prompt;
  }
  args.push('--prompt');
  args.push(`"${prompt}"`);
  if (options.sdmodel) {
    args.push('--ckpt');
    args.push(options.sdmodel);
  }
  if (options.width) {
    args.push('--W');
    args.push(options.width.toString());
  }
  if (options.height) {
    args.push('--H');
    args.push(options.height.toString());
  }
  if (options.steps) {
    args.push('--steps');
    args.push(options.steps.toString());
  }
  if (options.seed) {
    args.push('--seed');
    let seed = options.seed;
    if (options.randomSeed) {
      seed = Math.floor(Math.random() * 100000000);
    }
    args.push(seed.toString());
  }
  if (options.sampler_name) {
    args.push('--sampler');
    args.push(options.sampler_name);
  }
  if (options.batch_size) {
    args.push('--batch_size');
    args.push(options.batch_size.toString());
  }
  if (options.n_iter) {
    args.push('--n_iter');
    args.push(options.n_iter.toString());
  }
  if (lora) {
    args.push('--network_mul');
    args.push(lora.toString());
  }
  if (loraModelPath) {
    args.push('--network_module', 'networks.lora');
    args.push('--network_weights');
    args.push(loraModelPath);
  }


  const meta = readProjectMeta();

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
  let scriptName = 'gen_img_diffusers.py';
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
      text2ImageProcess = null;
      onClose?.();
    },
    onStdError: onStderr
  });
  text2ImageProcess = process;
  return process;
};

ipcMain.handle(ChannelsKeys.loraGenerateImage2, async (event, {
  loraModelPath,
  props,
  lora
}: { loraModelPath: string, props: any, lora: number }) => {
  generateText2ImageWithLora({
    loraModelPath,
    options: props,
    lora,
    onStdout: async (data) => {
      try {
        editorWindow?.webContents.send(ChannelsKeys.generateImageOut, data);
        const raw: ProcessOutputEvent<ImageGenerateOutVars> = JSON.parse(data.trim());
        if (raw.err) {
          editorWindow?.webContents.send(ChannelsKeys.generateImageError, raw.err);
          log.error(raw.err);
          return;
        }
        if (!raw.vars) {
          return;
        }
        const savedModel: SaveModel | undefined = await linkImageWithPathToModel(raw.vars.filename, loraModelPath, props);
        if (!savedModel) {
          return;
        }
        const models = await loraModelToRealPath([savedModel]);
        editorWindow?.webContents.send(ChannelsKeys.updateLoraModel, models);
      } catch (e) {

      }
    },
    onStderr: (data) => {
      editorWindow?.webContents.send(ChannelsKeys.generateImageOut, data);
    },
    onClose: () => {
      editorWindow?.webContents.send(ChannelsKeys.generateImageExit);
    }
  });
});


const getStableDiffusionModels = (): Array<SdModel> => {
  const config: TrainerSettings = dataStore.get(DataStoreKeys.trainerSetting);
  if (!config.sdwModelPath) {
    return [];
  }
  const ckptFiles = [];
  const files = fs.readdirSync(config.sdwModelPath);
  for (const file of files) {
    if (file.endsWith('.ckpt') || file.endsWith('.safetensors')) {
      ckptFiles.push({
        name: file,
        path: path.join(config.sdwModelPath, file)
      });
    }
  }
  return ckptFiles;
};

ipcMain.handle(ChannelsKeys.getStableDiffusionModelList, async () => {
  return await getStableDiffusionModels();
});

const openStableDiffusionModelFolder = async () => {
  const config: TrainerSettings = dataStore.get(DataStoreKeys.trainerSetting);
  if (!config.sdwModelPath) {
    return;
  }
  if (!fs.existsSync(config.sdwModelPath)) {
    fs.mkdirSync(config.sdwModelPath, { recursive: true });
  }
  await shell.openPath(config.sdwModelPath);
};

ipcMain.handle(ChannelsKeys.openStableDiffusionFolder, async () => {
  openStableDiffusionModelFolder();
});

ipcMain.on(ChannelsKeys.interruptGenerateImage, async (event) => {
  if (text2ImageProcess) {
    kill(text2ImageProcess.childProcess.pid!, 'SIGINT', function(error) {
      if (error) {
        log.error(error);
        return;
      }
      log.info(`preprocess process ${text2ImageProcess?.childProcess.pid!} killed`);
    });
  }
});
