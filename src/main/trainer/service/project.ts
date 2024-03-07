import { ChannelsKeys, NewProjectParam, PreProcessConfig, Project, RecentProject, SavedProject } from '../../../types';
import { getBackend } from '../backend/dispatch';
import { ipcMain } from 'electron';

const newProject = async (param: NewProjectParam): Promise<Project | undefined> => {
  return getBackend().newProject(param);
};
ipcMain.handle(ChannelsKeys.newProject, (event, param: NewProjectParam) => {
  return newProject(param);
});


const getRecentOpenProjects = async (): Promise<RecentProject[]> => {
  return getBackend().getRecentOpenProjects();
};
ipcMain.handle(ChannelsKeys.getRecentOpenProjects, async () => {
  return getRecentOpenProjects();
});

const getProjectList = async (): Promise<SavedProject[]> => {
  return getBackend().getProjectList();
}

ipcMain.handle(ChannelsKeys.getProjectList, async () => {
  return getBackend().getProjectList();
})


ipcMain.handle(ChannelsKeys.loadProject, async (event, { projectPath }: { projectPath: string }) => {
  return getBackend().loadProject({ projectPath });
});

ipcMain.on(ChannelsKeys.preprocess, async (event, config: PreProcessConfig) => {
  await getBackend().makePreprocess(config)
});
