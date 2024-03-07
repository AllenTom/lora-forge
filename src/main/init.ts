import { DataStoreKeys, LoraConfig, TrainerSettings } from '../types';
import { dataStore } from './store';
import fse from 'fs-extra';
import log from 'electron-log';
import {
  getNestedGitPath,
  getNestedScriptPath,
  getNestedTrainPythonPath,
  getNestStableDiffusionModelsPath
} from './paths';
import path from 'path';
import { exec } from 'child_process';

export const initApp = () => {
  let config: LoraConfig | undefined = dataStore.get(DataStoreKeys.trainerConfig);
  if (!config) {
    config = {
      loraPythonExec: '',
      preprocessRepo: ''
    };
  }
  let nestScriptPath = getNestedScriptPath();
  if (process.env.NODE_ENV === 'development' && process.env.SCP) {
    nestScriptPath = process.env.SCP;
  }
  if (fse.existsSync(nestScriptPath)) {
    log.info(`set loraPythonExec: ${nestScriptPath}`);
    config.loraPythonExec = nestScriptPath;
    config.preprocessRepo = nestScriptPath;
    log.info('check nested python exist');
    if (fse.existsSync(getNestedTrainPythonPath())) {
      log.info('nested python exist');
      const pythonExecBin = path.join(getNestedTrainPythonPath(), 'python.exe');
      if (fse.existsSync(pythonExecBin)) {
        log.info('create venv');
        const venvPath = path.join(nestScriptPath, 'venv');
        if (!fse.existsSync(venvPath)) {
          log.info('venv not exist');
          exec(`"${pythonExecBin}" -m venv "${venvPath}"`, (error, stdout, stderr) => {
            if (error) {
              log.error(`error: ${error.message}`);
              return;
            }
            if (stderr) {
              log.error(`stderr: ${stderr}`);
              return;
            }
            log.info(`stdout: ${stdout}`);
          });
        } else {
          log.info('venv exist');
        }
      }
    } else {
      log.info('nested python not exist');
    }

  }
  dataStore.set(DataStoreKeys.trainerConfig, config);
  let trainSetting: TrainerSettings | undefined = dataStore.get(DataStoreKeys.trainerSetting);
  if (!trainSetting) {
    trainSetting = {};
  }
  const gitPath = getNestedGitPath();
  if (fse.existsSync(gitPath)) {
    log.info('nested git exist');
    trainSetting.gitPath = path.join(gitPath, 'cmd', 'git.exe');
  } else {
    log.info('nested git not exist');
  }
  const nestedTrainPythonPath = getNestedTrainPythonPath();
  if (fse.existsSync(nestedTrainPythonPath)) {
    log.info('nested train python exist');
    trainSetting.trainerPythonPath = nestedTrainPythonPath;
  }
  // create stable diffusion models folder
  const stableDiffusionModelsPath = getNestStableDiffusionModelsPath();
  if (!fse.existsSync(stableDiffusionModelsPath)) {
    log.info('stable diffusion models folder not exist');
    fse.mkdirSync(stableDiffusionModelsPath, { recursive: true });
    trainSetting.sdwModelPath = stableDiffusionModelsPath;
  }
  dataStore.set(DataStoreKeys.trainerSetting, trainSetting);

};
