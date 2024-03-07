import { LoraOutputModel } from '../../../types';
import { openProjectId, readProjectMeta } from './project';

export const loadModel = async (): Promise<LoraOutputModel[]> => {
  if (!openProjectId) {
    return [];
  }

  const projectMeta = readProjectMeta(openProjectId)
  if (!projectMeta) {
    return [];
  }
  return []
};
