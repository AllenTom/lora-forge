import { generateLoraImage, onLoraSave } from './lora';
import { editorWindow } from '../../trainer';
import { UpdateTrainStatusRequest } from '../../../types';
import log from 'electron-log';
import { Request, Response } from 'express';
import { updateAppState } from './state';

const express = require('express');
const bodyParser = require('body-parser');

export type LoraModelSavedRequest = {
  path: string;
}

const loraSavedHandler = async (req:Request, res:Response) => {
  const { body } = req;
  const LoraModelSavedRequest = body as LoraModelSavedRequest;
  log.info('loraSavedHandler', LoraModelSavedRequest);
  try {
    await onLoraSave({
      savePath: LoraModelSavedRequest.path
    });
  } catch (e) {
    log.error(String(e));
  }
  res.send(body);
};

const trainProgressHandler = async (req:Request, res:Response) => {
  const { body } = req;
  const UpdateTrainStatusRequest = body as UpdateTrainStatusRequest;
  editorWindow?.webContents?.send('train-progress', UpdateTrainStatusRequest);
  res.send({});
};
export type AppStartRequest = {
  session: string,
  pid: string
}

export const runTrainerCallbackServer = async (port:number) => {
  const app = express();
  app.use(bodyParser.json());
  app.post('/callback/loreSaved', loraSavedHandler);
  app.post('/callback/trainProgress', trainProgressHandler);
  app.post('/test/makeLora', async (req:Request, res:Response) => {
    const { body } = req;
    const result = await generateLoraImage({
      loraModelPath: body.path
    });
    res.send(result);
  });
  updateAppState({
    callbackUrl: `http://localhost:${port}`
  })
  app.listen(port, () => {
    log.info(`appserver listening on port ${port}!`);
  });
};

