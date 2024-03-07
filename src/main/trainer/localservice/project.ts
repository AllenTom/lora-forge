import {
  ChannelsKeys,
  DatasetFolder,
  DatasetItem,
  DataStoreKeys,
  NewProjectParam,
  Project,
  ProjectMeta,
  RecentProject
} from '../../../types';
import path from 'path';
import { diff } from 'radash';
import fs from 'fs';
import { ipcMain } from 'electron';
import { createDataset, getImagePath, scanImageFiles } from './image';
import { randomString } from '../../../renderer/utils/string';
import { getOriginalImageFolder, loadOriginalImages, originalToRealPath } from './original';
import { loadPreprocessImages, preprocessImageToRealPath } from './preprocess';
import { dataStore } from '../../store';

export let openProjectPath: string | undefined;
export const newProject = async (param: NewProjectParam): Promise<Project | undefined> => {
  const projectPath = path.join(param.path!, param.name);
  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
  }
  openProjectPath = projectPath;
  const meta: ProjectMeta = {
    models: [],
    trainConfigs: [],
    preprocess: [],
    dataset: [],
    original: [],
    params: {
      width: param.width,
      height: param.height
    }
  };
  writeProjectMeta(meta);
  return loadProject({ projectPath });
};


const saveProject = async ({ dataset, folders, workDir }: {
  dataset: DatasetItem[],
  folders: DatasetFolder[],
  workDir: string
}) => {
  const sourcePath = path.join(workDir, 'preprocess');
  const oldImageItems = await scanImageFiles(sourcePath);
  const itemToRemove = diff(
    oldImageItems,
    dataset,
    a => a.imagePath
  );
  for (let datasetItem of itemToRemove) {
    await fs.promises.unlink(datasetItem.imagePath);
    if (datasetItem.captionPath) {
      await fs.promises.unlink(datasetItem.captionPath);
    }
  }
  for (let datasetItem of dataset) {
    // open and write
    const captionPath = datasetItem.captionPath || path.join(sourcePath, path.basename(datasetItem.imagePath).replace(path.extname(datasetItem.imagePath), '.txt'));
    if (datasetItem.captions) {
      const captionFile = await fs.promises.open(captionPath, 'w');
      await captionFile.writeFile(datasetItem.captions.join(','));
      await captionFile.close();
    }
  }
  // save to meta
  const projectMeta = await readProjectMeta();
  if (!projectMeta) {
    return;
  }
  projectMeta.dataset = folders;
  writeProjectMeta(projectMeta);
  // recreate dataset
  const datasetPath = path.join(workDir, 'dataset');
  await createDataset({ dataset, folders, out: datasetPath });
};

ipcMain.handle(ChannelsKeys.saveProject, async (event, { dataset, folders, workDir }: {
  dataset: DatasetItem[],
  folders: DatasetFolder[],
  workDir: string,
}) => {
  return saveProject({ dataset, folders, workDir });
});

export const loadProject = async ({ projectPath }: { projectPath: string }): Promise<Project | undefined> => {
  openProjectPath = projectPath;
  const preprocessPath = path.join(projectPath, 'preprocess');
  if (!fs.existsSync(preprocessPath)) {
    fs.mkdirSync(preprocessPath, { recursive: true });
  }
  const datasetPath = path.join(projectPath, 'dataset');
  if (!fs.existsSync(datasetPath)) {
    fs.mkdirSync(datasetPath, { recursive: true });
  }
  const modelOutPath = path.join(projectPath, 'model_out');
  if (!fs.existsSync(modelOutPath)) {
    fs.mkdirSync(modelOutPath, { recursive: true });
  }

  // create default train config if not exist
  let meta = readProjectMeta();
  if (!meta) {
    meta = {
      models: [],
      trainConfigs: [],
      preprocess: [],
      dataset: [],
      original: [],
      params: {
        width: 512,
        height: 512
      }
    };
  }
  if (meta.trainConfigs.length === 0) {
    const id = randomString(6);
    meta.trainConfigs.push({
      id,
      name: id,
      extraParams: [],
      loraPresetName: 'default',
      pretrained_model_name_or_path: 'runwayml/stable-diffusion-v1-5'
    });
  }
  writeProjectMeta(meta);


  // writeProjectMeta(meta);

  // get original images
  let originalImages = await loadOriginalImages();
  if (!originalImages) {
    return;
  }
  originalImages = originalToRealPath(originalImages)


  let preprocessItems = await loadPreprocessImages(originalImages) ?? [];
  preprocessItems = preprocessImageToRealPath(preprocessItems)


  addRecentOpenProject(projectPath);

  return {
    source: preprocessItems,
    dataset: (meta.dataset ?? []),
    modelOutPath: modelOutPath,
    preProcessPath: preprocessPath,
    datasetPath: datasetPath,
    original: originalImages,
    path: projectPath,
    params: meta.params
  };
};




export const getProjectMetaFile = () => {
  if (!openProjectPath) {
    return null;
  }
  const metafilePath = path.join(openProjectPath, 'project.json');
  if (!fs.existsSync(metafilePath)) {
    // create file
    const initMeta: ProjectMeta = {
      models: [],
      trainConfigs: [],
      preprocess: [],
      dataset: [],
      original: [],
      params: {
        width: 512,
        height: 512
      }

    };
    fs.writeFileSync(metafilePath, JSON.stringify(initMeta));
  }
  return metafilePath;
};

export const readProjectMeta = (): ProjectMeta | undefined => {
  const metafilePath = getProjectMetaFile();
  if (!metafilePath) {
    return undefined;
  }
  const raw = fs.readFileSync(metafilePath, 'utf-8');
  return JSON.parse(raw);
};

export const writeProjectMeta = (meta: ProjectMeta) => {
  const metafilePath = getProjectMetaFile();
  if (!metafilePath) {
    return;
  }
  fs.writeFileSync(metafilePath, JSON.stringify(meta, null, 2));
};

export const updateProjectMeta = (updateData: Partial<ProjectMeta>) => {
  const metafilePath = getProjectMetaFile();
  if (!metafilePath) {
    return;
  }
  const meta = readProjectMeta();
  if (!meta) {
    return;
  }
  const newMeta = { ...meta, ...updateData };
  fs.writeFileSync(metafilePath, JSON.stringify(newMeta, null, 2));
};

export const addRecentOpenProject = (projectPath: string) => {
  const recentProjects: string[] = dataStore.get(DataStoreKeys.recentProjects) ?? [];
  const newRecentProjects = [projectPath, ...recentProjects.filter(it => it !== projectPath)];
  dataStore.set(DataStoreKeys.recentProjects, newRecentProjects);
};

export const getRecentOpenProjects = async ():Promise<RecentProject[]> => {
  const projectPaths:string[] = dataStore.get(DataStoreKeys.recentProjects) ?? [];
  const projects = projectPaths.map((it:string) => {
    return {
      path: it,
      name: path.basename(it),
    };
  })
  return projects
}
