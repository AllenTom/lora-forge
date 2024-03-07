import { NewProjectParam, Project, ProjectMeta, RecentProject, SavedProject, TrainConfig } from '../../../types';
import { getBaseUrl, remoteClient } from './client';
import { getBackend } from '../backend/dispatch';
import { makeDataItemsRealLink, makeOriginalItemsRealLinks } from './utils';

export let openProjectId: string | undefined;

export const newProject = async (project: NewProjectParam): Promise<Project> => {
  const data = (await remoteClient.newProject(project)).data;
  if (!data) {
    throw new Error('no data');
  }
  openProjectId = project.name;
  data.path = project.name;
  return data;
};

export const readProjectMeta = async (projectId: string): Promise<ProjectMeta> => {
  return (await remoteClient.readProjectMeta(projectId)).data!;
};
export const getTrainConfigList = async (): Promise<TrainConfig[]> => {
  if (!openProjectId) {
    return [];
  }
  const meta = await readProjectMeta(openProjectId);
  if (!meta) {
    return [];
  }
  return meta.trainConfigs;
};


export const getRecentOpenProjects = async (): Promise<RecentProject[]> => {
  return [];
};

export const getProjectList = async (): Promise<SavedProject[]> => {
  const result = await remoteClient.getProjectList();
  if (!result.data) {
    return [];
  }
  return result.data;
};

export const loadProject = async ({ projectPath }: { projectPath: string }): Promise<Project> => {
  const data = (await remoteClient.loadProject(projectPath)).data;
  if (!data) {
    throw new Error('no data');
  }
  makeDataItemsRealLink(data.source);
  makeOriginalItemsRealLinks(data.original)
  openProjectId = projectPath;
  data.path = projectPath;
  return data;
};
