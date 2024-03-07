import { getRecentOpenProjects, loadProject, newProject } from './project';
import { Backend } from '../backend/types';
import { getTrainConfigList, loadModel } from './lora';
import { PreProcessConfig, SavedProject } from '../../../types';
import { makePreprocess } from './image';

class LocalBackend implements Backend {
  newProject = newProject;
  getTrainConfigList = getTrainConfigList;
  loadModel = loadModel;
  getRecentOpenProjects = getRecentOpenProjects;

  async getProjectList(): Promise<SavedProject[]> {
    return [];
  }

  loadProject = loadProject;
  makePreprocess = makePreprocess;
}

const localBackend = new LocalBackend();

export default localBackend;
