import { PythonShell } from 'python-shell';
import path from 'path';
import fs, { createReadStream } from 'fs';
import { createHash } from 'crypto';
import { dataStore } from './store';
import { DataStoreKeys, TrainerSettings } from '../types';
import { appPath } from './paths';
import log from 'electron-log';
import os from 'os';
import { exec } from 'child_process';

export const runPythonScript = (
  {
    scriptPath,
    args,
    pythonExec = 'python',
    workingDir,
    onStdout,
    env = {},
    onClose,
    onStdError
  }: {
    scriptPath: string,
    args: string[],
    pythonExec: string,
    workingDir?: string,
    onStdout?: (data: string) => void,
    onStdError?: (data: string) => void,
    env?: any,
    onClose?: (code: number) => void
  }) => {
  log.info(`will run command ${pythonExec} ${scriptPath} ${args.join(' ')}`);
  const trainerConfig: TrainerSettings = dataStore.get(DataStoreKeys.trainerSetting);
  let envs = {
    ...env
  };
  if (trainerConfig.proxy) {
    envs['http_proxy'] = trainerConfig.proxy;
    envs['https_proxy'] = trainerConfig.proxy;
  }
  exec("aa",{

  })
  const pyShell = new PythonShell(scriptPath, {
    pythonPath: pythonExec,
    cwd: workingDir,
    args: args,
    pythonOptions: ['-u'], // get print results in real-time
    env: envs,
    shell: true
  });
  pyShell.on('message', (data) => {
    log.info(data.toString());
    if (onStdout) {
      onStdout(data);
    }
  });
  pyShell.on('close', (code: any) => {
    log.info(`child process exited with code ${code}`);
    onClose?.(code);
  });
  pyShell.stderr.on('data', (data) => {

    if (onStdError) {
      onStdError(data);
    }
    log.error(data);
  });
  return pyShell;
};


export const getPythonVenvExecBin = () => {
  if (process.platform === 'win32') {
    return '.\\venv\\Scripts\\python.exe';
  } else if (process.platform === 'darwin') {
    return './venv/bin/python';
  }
  return undefined;
};
export const replaceFileExtension = (filePath: string, newExtension: string) => {
  const fileExtension = path.basename(filePath).split('.').pop();
  if (fileExtension) {
    return filePath.replace(fileExtension, newExtension);
  }
  return filePath;
};

export const getPath = (rawPath: string): string => {
  if (path.isAbsolute(rawPath)) {
    return rawPath;
  }
  return path.join(appPath!, rawPath);
};
export const getFileSha256 = async (filePath: string) => {
  const buff = fs.readFileSync(filePath);
  return createHash('sha256').update(buff).digest('hex');
};

export const copyFileWithProgress = async (src: string, dest: string, onProgress: (progressSize: number) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    const sourceStream = fs.createReadStream(src);
    const destinationStream = fs.createWriteStream(dest);
    sourceStream.on('data', (chunk) => {
      onProgress(chunk.length);
    });
    sourceStream.pipe(destinationStream);
    destinationStream.on('finish', () => {
      resolve();
    });
  });

};


export const monitorProcess = (pid: string): Promise<void> => {
  let command: string;
  switch (os.type()) {
    case 'Windows_NT':
      command = `tasklist /FI "PID eq ${pid}"`;
      break;
    default:
      command = `ps -p ${pid}`;
      break;
  }
  return new Promise(resolve => {
    let intervalId = setInterval(() => {
      exec(command, (err, stdout, stderr) => {
        if (os.type() === 'Windows_NT' && stdout.indexOf(pid.toString()) === -1) {
          console.log(`Process with pid: ${pid} has terminated.`);
          clearInterval(intervalId);  // stop interval when process is not found
          resolve();
        } else if (os.type() !== 'Windows_NT' && err) {
          console.log(`Process with pid: ${pid} has terminated.`);
          clearInterval(intervalId);  // stop interval when process is not found
          resolve();
        }
      });
    }, 1000);
  });
};
const allowImagesExtension = ['jpg', 'jpeg', 'png'];
export const scanImageFromFolder = (folderPath: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        reject(err);
      } else {
        const images = files.filter(file => {
          const fileExtension = path.basename(file).split('.').pop();
          return !!(fileExtension && allowImagesExtension.includes(fileExtension.toLowerCase()));

        });
        resolve(images);
      }
    });
  });
};

export const getHashFromString = (raw: string): string => {
  return createHash('sha256').update(raw).digest('hex');
};

export function getFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);

    stream.on('data', (data) => {
      hash.update(data);
    });

    stream.on('end', () => {
      const fileHash = hash.digest('hex');
      resolve(fileHash);
    });

    stream.on('error', (error) => {
      reject(error);
    });
  });
}
