import { isRemoteMode } from '../localservice/common';
import remoteBackend from '../remoteservice/backend';
import localBackend from '../localservice/backend';
import { Backend } from './types';

export const getBackend = (): Backend => {
  if (isRemoteMode()) {
    return remoteBackend;
  }
  return localBackend;
};
