import { AppState } from '../../../types';

const appState:AppState = {
  callbackUrl: 'http://localhost:6745',
}

export const updateAppState = (state:Partial<AppState>) => {
  Object.assign(appState, state);
}
export const getAppState = () => {
  return appState;
}
