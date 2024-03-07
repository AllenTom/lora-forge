import {
  ChannelsKeys,
  DatasetFolder,
  DatasetItem,
  NewProjectParam,
  Project,
  RecentProject,
  SavedProject
} from '../../../types';
import { ipcRenderer } from '../base';

export const loadDataset = async (datasetPath: string): Promise<DatasetItem[]> => {
  return ipcRenderer.invoke(ChannelsKeys.loadTagLibrary, { datasetPath });
};

export const createDataset = async (dataset: DatasetItem[], folders: DatasetFolder[], out: string) => {
  return ipcRenderer.invoke(ChannelsKeys.createDataset, { dataset, folders, out });
};

export const loadDatasetFromPath = async (datasetPath: string): Promise<DatasetFolder[]> => {
  return ipcRenderer.invoke(ChannelsKeys.loadDataset, { datasetPath });
};

export const loadProject = async (projectPath: string): Promise<Project> => {
  return ipcRenderer.invoke(ChannelsKeys.loadProject, { projectPath });
};

export const getProjectList = async (): Promise<SavedProject[]> => {
  return ipcRenderer.invoke(ChannelsKeys.getProjectList);
}

export const saveProject = async (args: {
  dataset: DatasetItem[],
  folders: DatasetFolder[],
  workDir: string,
}): Promise<void> => {
  return ipcRenderer.invoke(ChannelsKeys.saveProject, args);
};

export const newProject = async (param: NewProjectParam): Promise<Project> => {
  return ipcRenderer.invoke(ChannelsKeys.newProject, param);
};

export const getRecentlyProjects = async (): Promise<RecentProject[]> => {
  return ipcRenderer.invoke(ChannelsKeys.getRecentOpenProjects);
};
