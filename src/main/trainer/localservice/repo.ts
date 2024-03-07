import {
  ChannelsKeys,
  DataStoreKeys,
  InstallMessage,
  LoraConfig,
  RepoCloneProgress,
  TrainerSettings
} from '../../../types';
import { dataStore } from '../../store';
import * as path from 'path';
import * as fs from 'fs';
import { getPythonVenvExecBin } from '../../utils';
import os from 'os';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { simpleGit, SimpleGit, SimpleGitProgressEvent } from 'simple-git';
import { editorWindow } from '../../trainer';
import { ipcMain } from 'electron';
import { trainerWindow } from '../../main';
import log from 'electron-log';
import kill from 'tree-kill';

const LoraTrainRepoUrl = 'https://github.com/AllenTom/lora_train_core.git';
const LoraTrainRepoUrlCn = 'https://gitee.com/takayamaaren/lora-core.git';
let cloneController: AbortController | null = null;
let updateController: AbortController | null = null;
const checkRepo = async () => {
  const venvPath = getPythonVenvExecBin();
  if (!venvPath) {
    return false;
  }
  const trainConfig: LoraConfig = dataStore.get('training_config');
  if (!trainConfig.loraPythonExec) {
    return false;
  }
  if (!fs.existsSync(trainConfig.loraPythonExec)) {
    return false;
  }
  // check venv
  const repoPythonExec = path.join(trainConfig.loraPythonExec, venvPath);
  if (!fs.existsSync(repoPythonExec)) {
    return false;
  }
  // check preprocess
  if (!trainConfig.preprocessRepo) {
    return false;
  }
  if (!fs.existsSync(trainConfig.preprocessRepo)) {
    return false;
  }
  const preprocessPythonExec = path.join(trainConfig.preprocessRepo, venvPath);
  if (!fs.existsSync(preprocessPythonExec)) {
    return false;
  }
};
const getGitPath = () => {
  const trainSetting : TrainerSettings = dataStore.get(DataStoreKeys.trainerSetting);
  if (trainSetting?.gitPath && trainSetting?.gitPath !== '') {
    if (fs.existsSync(trainSetting.gitPath)) {
      return trainSetting.gitPath;
    }
  }
  return 'git';
};
const getGitConfig = (): string[] => {
  const config = [];
  const savedConfig: TrainerSettings = dataStore.get(DataStoreKeys.trainerSetting);
  if (savedConfig?.proxy) {
    config.push(`http.proxy=${savedConfig.proxy}`);
    config.push(`https.proxy=${savedConfig.proxy}`);
  }
  return config;
};
export let loraInstallProcess: ChildProcessWithoutNullStreams | null = null;
export const installLoraTrain = async (
  {
    workDir,
    onMessage
  }: {
    workDir: string
    onMessage?: (message: string) => void
  }) => {
  return new Promise((resolve, reject) => {
      let envs: any = {};
      const savedConfig: TrainerSettings = dataStore.get(DataStoreKeys.trainerSetting);
      if (savedConfig?.proxy && savedConfig?.proxy !== '') {
        envs['http_proxy'] = savedConfig.proxy;
        envs['https_proxy'] = savedConfig.proxy;
      }
      if(savedConfig.trainerPythonPath && fs.existsSync(savedConfig.trainerPythonPath)) {
        envs["PYTHON"] = path.join(savedConfig.trainerPythonPath, 'python.exe');
        envs["PYH"] = savedConfig.trainerPythonPath;
        envs["SKIP_VENV"] = "1"
      }
      let script = 'setup.bat';
      if (os.platform() === 'darwin') {
        if (savedConfig.loraScriptInstallWithCn) {
          script = 'setup_cn.sh';
        } else {
          script = 'setup.sh';
        }
      }
      if (os.platform() === 'win32') {
        if (savedConfig.loraScriptInstallWithCn) {
          script = 'setup_cn.bat';
        } else {
          script = 'setup.bat';
        }
      }

      let args: string[] = [];
      let exec = 'cmd';
      if (os.platform() === 'win32') {
        args = ['/c', `.\\${script}`];
        exec = 'cmd';
      } else if (os.platform() === 'darwin') {
        args = [script];
        exec = 'bash';
      }
      const bat = spawn(exec, args, {
        cwd: workDir,
        env: {
          ...process.env,
          ...envs
        }
      });
      loraInstallProcess = bat;
      bat.stdout.on('data', (data) => {
        console.log(data.toString());
        onMessage?.(data.toString());
      });

      bat.stderr.on('data', (data) => {
        console.error(data.toString());
        onMessage?.(data.toString());
      });

      bat.on('exit', (code) => {
        console.log(`Child exited with code ${code}`);
        onMessage?.(`Child exited with code ${code}`);
        if (code === 0) {
          resolve(code);
        } else {
          reject(code);
        }
      });
    }
  )
    ;
};

const interruptLoraInstall = () => {
  if (loraInstallProcess) {
    // 通过 PID 结束进程及其所有的子进程
    kill(loraInstallProcess.pid!, 'SIGKILL', function(err) {
      if (err) {
        console.log('Error while trying to terminate process:', err);
      } else {
        console.log('Successfully terminated process');
      }
    });
    loraInstallProcess = null;
  }
};
ipcMain.handle(ChannelsKeys.interruptInstallTrainRepo, async (event, args) => {
  interruptLoraInstall();
});
export const cloneRepo = (cloneDir: string, repoUrl: string, {
  onProgress
}: {
  onProgress?: (progress: number, event: SimpleGitProgressEvent) => void
}): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (cloneController) {
      cloneController.abort();
    }
    // remove if exists
    if (fs.existsSync(cloneDir)) {
      fs.rmdirSync(cloneDir, { recursive: true });
    }
    fs.mkdirSync(cloneDir);
    const progress = (gitProgressEvent: SimpleGitProgressEvent) => {
      console.log(`git.${gitProgressEvent.method} ${gitProgressEvent.stage} stage ${gitProgressEvent.progress}% complete`);
      if (onProgress) {
        onProgress(gitProgressEvent.progress, gitProgressEvent);
      }
    };
    cloneController = new AbortController();
    const git: SimpleGit = simpleGit({
      progress,
      config: getGitConfig(),
      binary: getGitPath(),
      timeout: {
        block: 5000
      },
      abort: cloneController.signal
    });
    git.clone(repoUrl, cloneDir, {}, (err) => {
      cloneController = null;
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
const updateLoraRepo = async (
  {
    onProgress
  }: {
    onProgress?: (progress: number, event: SimpleGitProgressEvent) => void
  }): Promise<void> => {
  const trainConfig: LoraConfig = dataStore.get(DataStoreKeys.trainerConfig);
  if (!trainConfig.loraPythonExec || !fs.existsSync(trainConfig.loraPythonExec)) {
    throw new Error('lora python exec not found');
  }
  if (updateController) {
    updateController.abort();
  }
  const progress = (gitProgressEvent: SimpleGitProgressEvent) => {
    log.info(`git.${gitProgressEvent.method} ${gitProgressEvent.stage} stage ${gitProgressEvent.progress}% complete`);
    if (onProgress) {
      onProgress(gitProgressEvent.progress, gitProgressEvent);
    }
  };
  updateController = new AbortController();
  const git: SimpleGit = simpleGit(trainConfig.loraPythonExec, {
    progress,
    config: getGitConfig(),
    binary: getGitPath(),
    timeout: {
      block: 10000
    },
    abort: updateController.signal
  });
  return new Promise((resolve, reject) => {
    git.pull((err) => {
      updateController = null;
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
ipcMain.handle(ChannelsKeys.updateTrainRepo, async (event, args) => {
  log.info('update train repo');
  return updateLoraRepo({});
});
export const sendEditorInstallMessage = (data: InstallMessage) => {
  editorWindow?.webContents.send('install-log', data);
};
/**
 * clone lora train repo
 * @param workDir work dir
 * @param onProgressEvent on progress event
 */
export const cloneLoraTrainRepo = async (
  {
    workDir,
    onProgressEvent
  }: {
    workDir: string,
    onProgressEvent?: (event: SimpleGitProgressEvent) => void
  }) => {
  let repoUrl = LoraTrainRepoUrl;
  const trainerSettings :TrainerSettings = dataStore.get(DataStoreKeys.trainerSetting);
  if (trainerSettings.loraScriptCnRepo){
    repoUrl = LoraTrainRepoUrlCn;
  }
  try {
    await cloneRepo(workDir, repoUrl, {
      onProgress: (progress: number, event) => {
        editorWindow?.webContents.send(ChannelsKeys.cloneRepoProgress, {
          progress,
          name: 'lora_train_core'
        } as RepoCloneProgress);
        onProgressEvent?.(event);
      }
    });
  } catch (e) {
    log.info('clone train repo fail');
    log.error(e);
    editorWindow?.webContents.send(ChannelsKeys.cloneFail, { repo: 'train', e });
    return;
  }
  log.info('clone train repo success');
  editorWindow?.webContents.send(ChannelsKeys.cloneSuccess, { repo: 'train' });
};

ipcMain.on(ChannelsKeys.cloneTrainRepo, async (event, args) => {
  log.info('clone train repo');
  try {
    await cloneLoraTrainRepo(args);
    trainerWindow?.webContents.send('clone-success', { repo: 'train' });
  } catch (e) {
    console.log(e);
    trainerWindow?.webContents.send('clone-fail', { repo: 'train' });
  }
});
ipcMain.on(ChannelsKeys.installTrainRepo, async (event, args) => {
  try {
    await installLoraTrain({
      ...args,
      onMessage: (message) => {
        sendEditorInstallMessage({
          message: message,
          type: 'info',
          event: 'message'
        });
      }
    });
    sendEditorInstallMessage({
      message: 'install success',
      type: 'info',
      event: 'repo-install-success'
    });
  } catch (e) {
    console.log(e);
    sendEditorInstallMessage({
      message: 'install success',
      type: 'info',
      event: 'repo-install-success'
    });
  }
});
