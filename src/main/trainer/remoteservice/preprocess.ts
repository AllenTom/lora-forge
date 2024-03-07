import { ChannelsKeys, DatasetItem, OriginalItem, PreProcessConfig, PreProcessOut } from '../../../types';
import { remoteClient } from './client';
import { openProjectId } from './project';
import { appendWsCallback, Message, removeWsCallback } from './websocket';
import { editorWindow } from '../../trainer';
import { preprocessImageToRealPath } from '../localservice/preprocess';
import { makeDataItemsRealLink, makeOriginalItemsRealLinks } from './utils';

export type PreprocessCompleteData = {
  original: OriginalItem[]
  preprocess: DatasetItem[]
}
export type PreprocessOutData = {
  src: string
  dest: string
  name: string
  index: number
  total: number
}

export const makePreprocess = async (config: PreProcessConfig) => {
  const callback = (data: Message<any>) => {
    if (data.event === 'preprocess_start') {
      const renderMessage: PreProcessOut = {
        message: 'preprocess',
        event: 'preprocess_start',
        vars: {}
      };
      editorWindow?.webContents.send(ChannelsKeys.preprocessOut, renderMessage);
    }
    if (data.event === 'preprocess_out') {
      const output = data.vars as PreprocessOutData;
      const renderMessage: PreProcessOut = {
        event: 'process_progress',
        message: 'preprocess',
        vars: output
      };
      editorWindow?.webContents.send(ChannelsKeys.preprocessOut, renderMessage);
    }
    if (data.event === 'preprocess_complete') {
      console.log('preprocess_complete');
      const output = data.vars as PreprocessCompleteData;
      makeDataItemsRealLink(output.preprocess);
      makeOriginalItemsRealLinks(output.original);
      // send done to out
      const messageVar: Array<{
        src: string,
        dest: string,
        name: string
      }> = [];
      output.preprocess.forEach((item, index) => {
        messageVar.push({
          src: item.originalPath!,
          dest: item.imagePath,
          name: item.imageName
        });
      });
      const renderMessage: PreProcessOut = {
        event: 'preprocess_done',
        message: 'preprocess',
        vars: messageVar
      };
      editorWindow?.webContents.send(ChannelsKeys.preprocessOut, renderMessage);

      //send done
      editorWindow?.webContents.send(ChannelsKeys.preprocessDone, {
        original: output.original,
        preprocess: output.preprocess
      });
    }
  };
  appendWsCallback(callback);
  remoteClient.makePreprocess(
    config.files ?? [],
    openProjectId!
  ).finally(() => {
    removeWsCallback(callback);
  });
  return;
};
