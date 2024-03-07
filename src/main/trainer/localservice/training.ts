import { ipcMain } from 'electron';
import * as path from 'path';
import { dataStore } from '../../store';
import { ChannelsKeys, DataStoreKeys, LoraConfig, LorePreset, TrainerSettings, TrainingConfig } from '../../../types';
import { getPythonVenvExecBin } from '../../utils';
import os from 'os';
import log from 'electron-log';
import fs from 'fs';
import { getAppState } from './state';

const { spawn } = require('child_process');
const generateTrainArgs = (config: TrainingConfig) => {
  const trainConfig: LoraConfig = dataStore.get('training_config');
  if (!trainConfig.loraPythonExec) {
    log.info('loraPythonExec is not set');
    return undefined;
  }
  let command = '';
  if (os.platform() === 'win32') {
    command = 'wt';
  } else if (os.platform() === 'darwin') {
    command = 'osascript';
  }

  const trainingArgs = [
    'train_network.py',
    '--output_dir',
    os.platform() == 'win32' ? `"${config.output_dir}"` : config.output_dir,
    '--output_name',
    os.platform() == 'win32' ? `"${config.output_name}"` : config.output_name,
    '--training_comment',
    os.platform() == 'win32' ? `"${config.output_name}"` : config.output_name,
    '--callback_url',
    getAppState().callbackUrl
  ];
  const argObject: { [key: string]: any } = {};
  Object.keys(config.params as any).forEach((key) => {
    const value = (config.params as any)[key];
    if (typeof value === 'string') {
      trainingArgs.push(`--${key}`);
      if (os.platform() === 'win32') {
        if (key === 'network_args') {
          trainingArgs.push(`${value}`);
          return;
        }
        if (value.includes(' ')) {
          trainingArgs.push(`'${value}'`);
        } else {
          trainingArgs.push(`"${value}"`);
        }
      } else {
        trainingArgs.push(value);
      }
      argObject[`--${key}`] = value;
    }
    if (typeof value === 'number') {
      trainingArgs.push(`--${key}`);
      trainingArgs.push(value.toString());
      argObject[`--${key}`] = value;
    }
    if (typeof value === 'boolean') {
      if (value) {
        trainingArgs.push(`--${key}`);
      }
      argObject[`--${key}`] = value;
    }
  });
  const pythonBinPath = getPythonVenvExecBin();
  if (!pythonBinPath) {
    log.info('pythonBinPath is not set');
    return undefined;
  }
  let pythonExec = path.join(trainConfig.loraPythonExec, pythonBinPath);
  const trainSettings: TrainerSettings = dataStore.get(DataStoreKeys.trainerSetting);
  if (trainSettings && trainSettings.trainerPythonPath && fs.existsSync(trainSettings.trainerPythonPath)) {
    pythonExec = path.join(trainSettings.trainerPythonPath, 'python.exe');
  }
  let args:any[] = [];
  if (os.platform() === 'win32') {
    args = ['-d', trainConfig.loraPythonExec, 'cmd.exe', '/c', 'start', pythonExec, '-m', 'accelerate.commands.launch', ...trainingArgs];
  } else if (os.platform() === 'darwin') {
    args = ['-e', `'tell application "Terminal" to do script "cd ${trainConfig.loraPythonExec} && ${pythonExec} -m accelerate.commands.launch ${trainingArgs.join(' ')}"'`];
  }
  return {
    command,
    args,
    pythonExec: trainConfig.loraPythonExec,
    trainingArgs,
    binPath: pythonExec,
    argObject
  };
};
ipcMain.handle(ChannelsKeys.getTrainPreview, (event, args) => {
  return generateTrainArgs(args);
});
const startTraining = (config: TrainingConfig) => {
  const context = generateTrainArgs(config);
  if (!context) {
    return;
  }
  const { command, args, pythonExec } = context as any;
  console.log(command, args.join(' '));
  const cwd = pythonExec;
  let envs: { [key: string]: string } = {};
  const savedConfig: TrainerSettings = dataStore.get(DataStoreKeys.trainerSetting);
  if (savedConfig?.proxy) {
    envs['http_proxy'] = savedConfig.proxy
    envs['https_proxy'] = savedConfig.proxy
  }
  const terminal = spawn(
    command,
    args,
    {
      env: {
        ...process.env,
        ...envs
      },
      cwd
    }
  );
  terminal.stdout.on('data', (data: any) => {
    console.log(`stdout: ${data}`);
  });
  terminal.stderr.on('data', (data: any) => {
    console.log(`stderr: ${data}`);
  });
  terminal.on('close', (code: any) => {
    console.log(`child process exited with code ${code}`);
  });

};
ipcMain.on(ChannelsKeys.startTraining, (event, args) => {
  startTraining(args);
});

const defaultLoraPresets: LorePreset[] = [
  {
    name: 'default',
    params: {
      'network_module': 'networks.lora',
      'train_batch_size': 1,
      'caption_extension': '.txt',
      'mixed_precision': 'fp16',
      'save_precision': 'fp16',
      'cache_latents': true,
      'seed': 1234,
      'learning_rate': 0.0001,
      'lr_scheduler': 'constant',
      'optimizer_type': 'AdamW8bit',
      'text_encoder_lr': 0.00005,
      'unet_lr': 0.0001,
      'network_dim': 128,
      'network_alpha': 128,
      'resolution': '512,512',
      'gradient_accumulation_steps': 1,
      'prior_loss_weight': 1,
      'lr_scheduler_num_cycles': 1,
      'lr_scheduler_power': 1,
      'clip_skip': 1,
      'max_token_length': 150,
      'xformers': true,
      'bucket_no_upscale': true,
      'bucket_reso_steps': 64,
      'vae_batch_size': 1,
      'max_data_loader_n_workers': 8,
      'sample_sampler': 'euler_a',
      'save_every_n_steps': 100
    } as any,
    builtIn: true
  }
];
const addTrainingConfig = (config: LorePreset) => {
  let configList: LorePreset[] = dataStore.get(DataStoreKeys.loraPreset) ?? [];
  if (configList.find((item) => item.name === config.name)) {
    configList = configList.map((item) => {
      if (item.name === config.name) {
        return {
          name: config.name,
          params: {
            ...item.params,
            ...config.params
          },
          builtIn: false
        };
      }
      return item;
    });
  } else {
    configList = [config, ...configList];
  }
  dataStore.set(DataStoreKeys.loraPreset, configList);
};
const removeTrainingConfig = (name: string) => {
  let configList: LorePreset[] = dataStore.get(DataStoreKeys.loraPreset) ?? [];
  configList = configList.filter((item) => item.name !== name);
  dataStore.set(DataStoreKeys.loraPreset, configList);
};
const getLoraPresetList = () => {
  let configList: LorePreset[] = dataStore.get(DataStoreKeys.loraPreset) ?? [];
  return [...defaultLoraPresets, ...configList];
};
ipcMain.handle(ChannelsKeys.addLoraData, (event, args) => {
  addTrainingConfig(args);
});
ipcMain.handle(ChannelsKeys.removeLoraData, (event, args) => {
  removeTrainingConfig(args);
});

ipcMain.handle(ChannelsKeys.getLoraPresetList, () => {
  return getLoraPresetList();
});

