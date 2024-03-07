import log from 'electron-log';
import { ChannelsKeys, DataStoreKeys, DoctorOutput, LoraConfig, TrainerSettings } from '../../../types';
import { dataStore } from '../../store';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { runPythonScript } from '../../utils';
import { splashWindow } from '../../trainer';
import { ipcMain } from 'electron';

const startCheck = () => {
  log.info('start doctor check');


  const args = [
    '--json_out',
    '--case',
    'start'
  ];
  const trainConfig: LoraConfig = dataStore.get(DataStoreKeys.trainerConfig);
  if (!trainConfig.preprocessRepo) {
    return;
  }
  let envs: { [key: string]: string } = {};
  const savedConfig: TrainerSettings = dataStore.get(DataStoreKeys.trainerSetting);
  if (savedConfig?.proxy) {
    envs['http_proxy'] = savedConfig.proxy;
    envs['https_proxy'] = savedConfig.proxy;
  }
  let pythonExec = path.join(trainConfig.preprocessRepo, '\\venv\\Scripts\\python.exe');
  const trainSettings: TrainerSettings = dataStore.get(DataStoreKeys.trainerSetting);
  if (trainSettings && trainSettings.trainerPythonPath && fs.existsSync(trainSettings.trainerPythonPath)) {
    pythonExec = path.join(trainSettings.trainerPythonPath, 'python.exe');
  }

  if (os.platform() === 'darwin') {
    pythonExec = path.join(trainConfig.preprocessRepo, '/venv/bin/python');
  }

  const scriptPath = path.join(trainConfig.preprocessRepo, 'doctor_cli.py');
  const cwd = trainConfig.preprocessRepo;
  const process = runPythonScript({
    pythonExec,
    scriptPath,
    args: args as any,
    workingDir: cwd,
    onStdout: (data) => {
      log.info(data);
      try {
        const result: DoctorOutput = JSON.parse(data);
        log.info(result);
        if (result.event) {
          switch (result.event) {
            case 'checkPassed':
              splashWindow?.webContents.send(ChannelsKeys.doctorCheckSuccess, result);
              break;
            case 'checkFailed':
              splashWindow?.webContents.send(ChannelsKeys.doctorCheckFail, result);
              break;
          }
        }
      } catch (e) {

      }
    },
    env: envs
  });
  return process;
};

ipcMain.handle(ChannelsKeys.startCheckDoctor, () => {
  startCheck();
});
