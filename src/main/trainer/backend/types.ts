import {
  LoraOutputModel,
  NewProjectParam,
  PreProcessConfig,
  Project,
  RecentProject,
  SavedProject,
  TrainConfig
} from '../../../types';

export interface Backend {
  newProject(param: NewProjectParam): Promise<Project | undefined>;

  getTrainConfigList(): Promise<TrainConfig[]>;

  loadModel(): Promise<LoraOutputModel[]>;

  getRecentOpenProjects(): Promise<RecentProject[]>;

  getProjectList(): Promise<SavedProject[]>;

  loadProject({ projectPath }: { projectPath: string }): Promise<Project | undefined>;

  makePreprocess(config: PreProcessConfig): Promise<void>;
}
