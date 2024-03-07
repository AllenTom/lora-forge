import { appPath } from './paths';
import path from 'path';

const Store = require('electron-store');

export const dataStore = new Store({
  cwd:path.join(appPath!),

});
