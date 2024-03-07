import { atom } from 'jotai';

import {
  DatasetFolder,
  DatasetItem,
  LoraOutputModel,
  OriginalItem,
  PretrainModel,
  ProjectParam,
  RecentProject,
  TrainConfig,
  TrainStatus
} from '../../../types';
import { Key } from 'react';

export type PreprocessState = {
  width: number
  height: number
  sourcePath?: string
  asDataset: boolean
  datasetName?: string
  trainSteps: string
  danbooruCaption: boolean
  blipCaption: boolean
  clipCaption: boolean
  clip2Caption: boolean
  wdCaption: boolean
  wdGeneralThreshold: number
  wdModelName?: string
  flip: boolean
  faceFocus: boolean
  focusAnimeFace: boolean
  focusAnimeFaceRatio: number
  focusAnimeBody: boolean
  focusAnimeBodyRatio: number
  focusAnimeHalfBody: boolean
  focusAnimeHalfBodyRatio: number
  focusToTop: boolean
}
export type TrainingState = {
  workDir?: string;
  preprocessPath?: string;
  datasetPath?: string;
  modelOutPath?: string;
  preprocess: PreprocessState
  datasetSource?: DatasetItem[]
  datasetFolders?: DatasetFolder[]
  panelIndex?: Key;
  originalImage?: OriginalItem[]
  projectParams?: ProjectParam,
  recentProjects: RecentProject[]
}
export const trainingContextAtom = atom<TrainingState>({
  preprocess: {
    width: 512,
    height: 512,
    danbooruCaption: false,
    asDataset: true,
    trainSteps: '100',
    blipCaption: false,
    clipCaption: false,
    clip2Caption: false,
    wdCaption: true,
    wdGeneralThreshold: 0.5,
    wdModelName: 'MOAT',
    flip: false,
    faceFocus: false,
    focusAnimeFace: false,
    focusAnimeFaceRatio: 1,
    focusAnimeBody: false,
    focusAnimeBodyRatio: 0,
    focusAnimeHalfBody: false,
    focusAnimeHalfBodyRatio: 0,
    focusToTop: false
  },
  datasetFolders: [],
  panelIndex: '0',
  recentProjects: []
});
export const updateTrainingContextAtom = atom(null, (get, set, updateData: Partial<TrainingState>) => {
  const prev = get(trainingContextAtom);
  set(trainingContextAtom, { ...prev, ...updateData });
});
export const preprocessAtom = atom(
  get => {
    const trainContext = get(trainingContextAtom);
    return trainContext.preprocess;
  },
  (get, set, updateData: Partial<PreprocessState>) => {
    const prev = get(trainingContextAtom);
    set(trainingContextAtom, {
      ...prev,
      preprocess: {
        ...prev.preprocess,
        ...updateData
      }
    });
  }
);
export type CaptionFilter = 'allCaption' | 'noCaption' | 'hasCaption'
export type DatasetItemFilter = {
  captionFilter: CaptionFilter
}
export type DatasetState = {
  currentFolderName: string
  selectedTags: string[]
  selectItemNames: string[]
  currentFilePath?: string,
  filter: DatasetItemFilter
}
export const datasetAtom = atom<DatasetState>({
  selectedTags: [],
  selectItemNames: [],
  filter: {
    captionFilter: 'allCaption'
  },
  currentFolderName: 'all'
});
export const updateDatasetAtom = atom(null, (get, set, updateData: Partial<DatasetState>) => {
  const prev = get(datasetAtom);
  set(datasetAtom, { ...prev, ...updateData });
});
export type MonitorState = {
  currentModelName?: string
  outputModel: LoraOutputModel[]
  currentState?: TrainStatus
}
export const monitorAtom = atom<MonitorState>({
  outputModel: []
});

export const updateMonitorAtom = atom(null, (get, set, updateData: Partial<MonitorState>) => {
  const prev = get(monitorAtom);
  set(monitorAtom, { ...prev, ...updateData });
});
export const outputModelAtom = atom(get => {
  return get(monitorAtom).outputModel;
}, (get, set, updateData: LoraOutputModel[]) => {
  const prev = get(monitorAtom);
  set(monitorAtom, {
    ...prev,
    outputModel: updateData
  });
});
export const currentOutputModelAtom = atom(get => {
  const monitorState = get(monitorAtom);
  return monitorState.outputModel.find(it => it.fileName === monitorState.currentModelName);
});
export const itemsAtom = atom<DatasetItem[]>((get: any) => {
  const datasetContext = get(datasetAtom);
  const trainContext = get(trainingContextAtom);
  if (!trainContext.datasetSource) {
    return [];
  }
  let displayDataset = trainContext.datasetSource;
  if (datasetContext.selectedTags.length > 0) {
    displayDataset = trainContext.datasetSource.filter((it: DatasetItem) => {
      return it.captions?.some(tag => datasetContext.selectedTags.includes(tag));
    });
  }
  if (!datasetContext.currentFolderName || !trainContext.datasetFolders) {
    return undefined;
  }
  const currentFolder = trainContext.datasetFolders.find((it: DatasetFolder) => it.name === datasetContext.currentFolderName);
  if (currentFolder) {
    displayDataset = displayDataset.filter((it: DatasetItem) => currentFolder.images.includes(it.imagePath));
  }
  if (datasetContext.currentFolderName === 'unused') {
    const usedImages = trainContext.datasetFolders!.flatMap((it: DatasetFolder) => it.images);
    displayDataset = displayDataset.filter((it: DatasetItem) => !usedImages.includes(it.imagePath));
  }
  return displayDataset;
});

export type ConfigState = {
  list: TrainConfig[]
  currentConfigId?: string
  pretrainedModels: PretrainModel[],
  config?: TrainConfig
}
export const configAtom = atom<ConfigState>({
  list: [],
  pretrainedModels: []
});

export const updateConfigAtom = atom(null, (get, set, updateData: Partial<ConfigState>) => {
  const prev = get(configAtom);
  set(configAtom, { ...prev, ...updateData });
});
export const currentConfigAtom = atom(get => {
  const configState = get(configAtom);
  return configState.list.find(it => it.id === configState.currentConfigId);
});


export type ModelState = {
  list: LoraOutputModel[]
  currentSelectedModelName?: string
}
export const modelsAtom = atom<ModelState>({
  list: []
});

export const currentModelAtom = atom(get => {
  const modelState = get(modelsAtom);
  return modelState.list.find(it => it.fileName === modelState.currentSelectedModelName);
});

export type OriginalState = {
  currentOriginalHash?: string
}

export const originalAtom = atom<OriginalState>({
  currentOriginalHash: undefined
});
export const updateOriginalAtom = atom(null, (get, set, updateData: Partial<OriginalState>) => {
  const prev = get(originalAtom);
  set(originalAtom, { ...prev, ...updateData });
});
export const currentOriginalAtom = atom(get => {
  const originalState = get(originalAtom);
  const trainContext = get(trainingContextAtom);
  if (!trainContext.originalImage) {
    return undefined;
  }
  return trainContext.originalImage.find(it => it.hash === originalState.currentOriginalHash);
});

export const currentOriginalPreprocessImageAtom = atom(get => {
  const originalState = get(originalAtom);
  const trainContext = get(trainingContextAtom);
  if (!trainContext.originalImage) {
    return [];
  }
  const originalItem = trainContext.originalImage.find(it => it.hash === originalState.currentOriginalHash);
  if (!originalItem) {
    return [];
  }
  const preprocess = trainContext.datasetSource;
  if (!preprocess) {
    return [];
  }
  return preprocess.filter(it => it.originalPath === originalItem.src);
});
