import path from 'path';
import { cloneLoraTrainRepo, installLoraTrain } from './repo';
import { app, ipcMain } from 'electron';
import { installWindow } from '../../trainer';
import { ChannelsKeys, InstallMessage, LoraConfig } from '../../../types';
import { dataStore } from '../../store';
import * as fs from 'fs';
import os from 'os';
import { spawn } from 'child_process';
import { getPythonVenvExecBin } from '../../utils';

export const sendInstallMessage = (data: InstallMessage) => {
  installWindow?.webContents.send(ChannelsKeys.installLog, data);
};
const installRepo = async ({ installPath }: { installPath: string }) => {
  sendInstallMessage({
    message: `start install`,
    type: 'info',
    event: 'start-install'
  });
  // clone train repo
  sendInstallMessage({
    message: `clone train path`,
    type: 'info',
    event: 'message'
  });
  const trainPath = path.join(installPath, 'repo-train');
  sendInstallMessage({
    message: `install train path to: ${trainPath}`,
    type: 'info',
    event: 'message'
  });
  await cloneLoraTrainRepo({
    workDir: trainPath,
    onProgressEvent: (progressEvent) => {
      sendInstallMessage({
        message: `${progressEvent.method} [${progressEvent.stage}] ${progressEvent.progress}`,
        type: 'info',
        event: 'message'
      });
    }
  });
  // install train
  sendInstallMessage({
    message: `install train`,
    type: 'info',
    event: 'message'
  });
  await installLoraTrain({
    workDir: trainPath,
    onMessage: (message) => {
      installWindow?.webContents.send('install-log', { message: message });
      sendInstallMessage({
        message: message,
        type: 'info',
        event: 'message'
      });
    }
  });
  installWindow?.webContents.send('install-log', { message: `install success save config` });
  const config: LoraConfig = dataStore.get('training_config');
  config.preprocessRepo = trainPath;
  config.loraPythonExec = trainPath;
  dataStore.set('training_config', config);
  sendInstallMessage({
    message: `install success`,
    type: 'info',
    event: 'install-success'
  });
};
const getDefaultInstallPath = () => {
  return app.getPath('userData');
};
ipcMain.on(ChannelsKeys.installDep, async (event, args: { installPath: string }) => {
  await installRepo(args);
});

ipcMain.handle(ChannelsKeys.getDefaultInstallPath, async (event, args) => {
  return getDefaultInstallPath();
});

const checkNeedInstall = async ({ targetPath }: { targetPath?: string }) => {
  let preprocessorPath;
  let trainPath;
  if (targetPath) {
    preprocessorPath = path.join(targetPath, 'repo-preprocess');
    trainPath = path.join(targetPath, 'repo-train');

  } else {
    const config: LoraConfig = dataStore.get('training_config');
    preprocessorPath = config.preprocessRepo;
    trainPath = config.loraPythonExec;
  }

  if (!preprocessorPath || !trainPath) {
    return true;
  }
  return !fs.existsSync(preprocessorPath) || !fs.existsSync(trainPath);

};

ipcMain.handle(ChannelsKeys.checkNeedInstall, async (event, args) => {
  return await checkNeedInstall(args);
});

const setInstallDir = async ({ targetPath }: { targetPath: string }) => {
  const config: LoraConfig = dataStore.get('training_config');
  config.preprocessRepo = path.join(targetPath, 'repo-preprocess');
  config.loraPythonExec = path.join(targetPath, 'repo-train');
  dataStore.set('training_config', config);
};

ipcMain.handle(ChannelsKeys.setInstallDir, async (event, args) => {
  await setInstallDir(args);
});
export const accelerateConfig = async () => {

  const config: LoraConfig = dataStore.get('training_config');
  const workDir = config.loraPythonExec;
  let command = '';
  if (os.platform() === 'win32') {
    command = 'wt';
  } else if (os.platform() === 'darwin') {
    command = 'osascript';
  }
  const pythonBinPath = getPythonVenvExecBin();
  if (!pythonBinPath || !workDir) {
    return;
  }
  let pythonExec = path.join(workDir, pythonBinPath);
  let args:string[] = [];

  if (os.platform() === 'win32') {
    args = ['-d', workDir, 'cmd.exe', '/c', 'start', pythonExec, '-m', 'accelerate.commands.config.config', ...args];
  } else if (os.platform() === 'darwin') {
    args = ['-e', `'tell application "Terminal" to do script "cd ${workDir} && ${pythonExec} -m accelerate.commands.config.config ${args.join(' ')}"'`];
  }
  const bat = spawn(command, args, {
    cwd: workDir,
    env: {
      ...process.env
    }
  });

  bat.stdout.on('data', (data) => {
    console.log(data.toString());

  });

  bat.stderr.on('data', (data) => {
    console.error(data.toString());
  });

  bat.on('exit', (code) => {
    console.log(`Child exited with code ${code}`);
  });
};
ipcMain.on(ChannelsKeys.accelerateConfig, async () => {
  await accelerateConfig();
});
