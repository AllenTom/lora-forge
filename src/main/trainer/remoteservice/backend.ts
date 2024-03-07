import { getProjectList, getRecentOpenProjects, getTrainConfigList, loadProject, newProject } from './project';
import { Backend } from '../backend/types';
import { loadModel } from './lora';
import './websocket';
import { makePreprocess } from './preprocess';

class RemoteBackend implements Backend {
  newProject = newProject;
  getTrainConfigList = getTrainConfigList;
  loadModel = loadModel;
  getRecentOpenProjects = getRecentOpenProjects;
  getProjectList = getProjectList;
  loadProject = loadProject;
  makePreprocess = makePreprocess;
}

const remoteBackend = new RemoteBackend();
export default remoteBackend;
