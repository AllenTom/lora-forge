import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import { ExtraConfig } from '../types';
import log from 'electron-log';

const getAppPath = () => {
  if (process.env.NODE_ENV === 'development') {
    return app.getAppPath();
  }
  if (process.env.NODE_ENV === 'production') {
    return path.dirname(app.getPath('exe'));
  }
};
const getResourcePath = () => {
  return path.join(getAppPath()!, 'resources', 'app');
};
export const getNestedTrainPythonPath = () => {
  return path.join(getResourcePath(), 'Python');
};

export const getNestedScriptPath = () => {
  return path.join(getResourcePath(), 'lora_train_core');
};
export const getNestedGitPath = () => {
  return path.join(getResourcePath(), 'git');
}
export const getNestedPretrainPath = () => {
  return path.join(getResourcePath(), 'pretrain_models');
}
export const getNestStableDiffusionModelsPath = () => {
  return path.join(getResourcePath(), 'stable-diffusion-models');
}
export const appPath = getAppPath();
export const resourcePath = getResourcePath();
export const modelPreviewPath = path.join(appPath!, 'sdl-data', 'images');
export const getModelPreviewPath = (modelFilename: string) => {
  return path.join(modelPreviewPath, `${path.basename(modelFilename, path.extname(modelFilename))}.jpg`);
};

export const initPaths = () => {
  log.info(`initPaths`);
  const paths = [
    modelPreviewPath
  ];
  for (const p of paths) {
    if (!fs.existsSync(p)) {
      log.info(`mkdir ${p}`);
      fs.mkdirSync(p, { recursive: true });
    }
  }
};

export const readExtraConfig = (): ExtraConfig | undefined => {
  const configPath = path.join(appPath!, 'config.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
  return undefined;
};
