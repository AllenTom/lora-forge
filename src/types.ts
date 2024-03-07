export type AppState = {
  callbackUrl: string
}
export type ExtraConfig = {
  sdwPath?: string;
  gitPath?: string;
}

export enum DataStoreKeys {
  loraPreset = 'loraPreset',
  trainerSetting = 'trainer_setting',
  trainerConfig = 'training_config',
  recentProjects = 'recent_projects',
}

export type AppConfig = {
  useProxy?: boolean;
  httpProxy?: string;
  httpsProxy?: string;
}
export type SDWParameter = {
  name: string
  label: string
  description: string
  type: 'string' | 'number' | 'boolean' | 'folder' | 'float' | 'integer'
  default: any
  category?: string
  choices?: string[]
  visible?: boolean
  textArea?: boolean
  num?: Num
}


export type PreProcessConfig = {
  folders?: string[];
  files?: string[];
  destPath?: string;
  width?: number;
  height?: number;
  danbooruCaption?: boolean;
  clipCaption?: boolean;
  clip2Caption?: boolean;
  blipCaption?: boolean;
  wdCaption?: boolean
  wdGeneralThreshold?: number
  wdModelName?: string;
  flip?: boolean;
  faceFocus: boolean
  focusAnimeFace: boolean
  focusAnimeFaceRatio: number
  focusAnimeBody: boolean
  focusAnimeBodyRatio: number
  focusAnimeHalfBody: boolean
  focusAnimeHalfBodyRatio: number
  focusToTop: boolean
}

export type PreProcessOut = {
  event: 'preprocess_start' | 'process_progress' | 'preprocess_done' | 'start_download_model' | 'end_download_model' | 'download_model_progress';
  message: string;
  vars: any
}

export type OriginalItem = {
  hash: string
  src: string
  fileName?: string
  thumbnail: string
}
export type CaptionHistory = {
  taggerId: string
  name: string
  rank: number
  createdAt: string
}
export type DatasetItem = {
  hash: string
  imageName: string
  imagePath: string
  captionPath?: string
  captions?: string[],
  originalPath?: string,
  captionHistory?: CaptionHistory[]
}
export type DatasetFolder = {
  name: string,
  step: number
  images: string[]
}
export type LoraConfig = {
  loraPythonExec?: string
  preprocessRepo?: string
}

export type TrainEnvContext = {
  command: string,
  args: string[],
  pythonExec: string[],
  trainingArgs: string[]
  binPath: string
  argObject: any
}

export type TrainParams = {
  network_module: string
  // train_data_dir: string
  // pretrained_model_name_or_path: string
  save_model_as: string
  train_batch_size: number
  caption_extension: string
  mixed_precision: string
  save_precision: string
  cache_latents: boolean
  seed: number
  learning_rate: number
  lr_scheduler: string
  optimizer_type: string
  text_encoder_lr: number
  unet_lr: number
  network_dim: number
  network_alpha: number
  resolution: string
  gradient_accumulation_steps: number
  prior_loss_weight: number
  lr_scheduler_num_cycles: number
  lr_scheduler_power: number
  clip_skip: number
  max_token_length: number
  xformers: boolean
  bucket_no_upscale: boolean
  bucket_reso_steps: number
  vae_batch_size: number
  max_data_loader_n_workers: number
  sample_sampler: string
  save_every_n_steps: number
}
export type TrainingConfig = {
  output_name?: string;
  output_dir?: string;
  params?: TrainParams
}
export type RepoCloneProgress = {
  name: string
  progress: number
}
export type InstallMessage = {
  message: string
  type: 'info' | 'error' | 'success'
  event: 'start-install' | 'clone-preprocess-repo' | 'install-preprocess-repo' | 'clone-train-repo' | 'install-train-repo' | 'repo-install-success' | 'repo-install-failed' | 'message' | 'install-success'
}
export type LorePreset = {
  name: string
  params: TrainParams
  builtIn: boolean
}

export type Project = {
  source: DatasetItem[]
  dataset: DatasetFolder[],
  modelOutPath: string,
  preProcessPath: string,
  datasetPath: string,
  original: OriginalItem[],
  path: string,
  params: ProjectParam
}
export type SaveModelPreview = {
  imgPath?: string,
  props?: any
}
export type SaveModel = {
  path: string,
  name: string,
  previews: SaveModelPreview[]
}
export type ProjectParam = {
  width: number,
  height: number
}
export type ProjectMeta = {
  models: SaveModel[]
  trainConfigs: TrainConfig[]
  previewProps?: any,
  preprocess: Array<{
    hash: string
    src?: string
    dest: string
    captionHistory?: CaptionHistory[]
  }>
  dataset: Array<{
    name: string,
    step: number,
    images: string[],
  }>
  original: OriginalItem[],
  params: ProjectParam
}
export type LoraPreviewImage = {
  outImage?: string;
  props?: any
  modelName?: string
}
export type LoraOutputModel = {
  name: string
  path: string
  fileName: string
  preview: LoraPreviewImage[]
}
export type ValidateRule = {
  name: string,
  message?: string,
  messageRender: (value: any, values: any) => string
  validate: (value: any, values: any) => boolean,
}
export type Recommendation = {
  name: string,
  message?: string,
  messageRender: (value: any, values: any) => string
  validate: (value: any, values: any) => boolean,
}
export type Num = {
  min?: number,
  max?: number,
  step?: number,
}
export type TrainParameter = {
  name: string
  description: string
  type: 'string' | 'number' | 'boolean' | 'folder' | 'float' | 'integer'
  default: any
  category?: string
  choices?: any[],
  validate?: ValidateRule[]
  recommendation?: Recommendation[],
  num?: Num
}
export type TrainConfig = {
  id?: string
  name?: string
  loraPresetName?: string;
  modelName?: string
  pretrained_model_name_or_path?: string,
  modelType?: ModelType
  extraParams: any
}
export type TrainStatus = {
  epoch: number
  step: number
  total_step: number
  total_epoch: number
  loss: number
}
export type UpdateTrainStatusRequest = {
  status: TrainStatus
}
export type Text2ImageOptions = {
  sdmodel: string
  prompt: string
  negative_prompt: string
  width: number
  height: number
  steps: number
  sampler_name: string
  cfg_scale: number
  enable_hr: boolean
  hr_upscaler: string
  hr_scale: number
  hr_resize_x: number
  hr_resize_y: number
  hr_second_pass_steps: number
  denoising_strength: number
  batch_size: number
  n_iter: number
  seed: number
  randomSeed: boolean
}


export type TrainerSettingParameter = {
  name: string
  label: string
  description: string
  type: 'string' | 'number' | 'boolean' | 'folder' | 'float' | 'integer'
  default: any
  category?: string
  choices?: string[]
}
export type TrainerSettings = {
  proxy?: string
  sdwPath?: string
  sdwPort?: string
  sdwModelPath?: string
  loraScriptInstallWithCn?: boolean
  loraScriptCnRepo?: boolean
  previewXformers?: boolean
  gitPath?: string
  trainerPythonPath?: string
}
export type SdModel = {
  name: string
  path: string
}

export type NewProjectParam = {
  name: string
  path?: string
  width: number
  height: number
}
export type NewPreprocessImageParam = {
  base64Data: string, sourceImageFileName: string
}
export type ImportOriginalProcess = {
  name: string
  path: string
  total: number
  current: number
  status: 'running' | 'stopped' | 'done',
  importedImages: string[]
}
export type DoctorOutput = {
  message: string
  level: number
  event?: 'checkPassed' | 'checkFailed' | 'message'
}
export type RecentProject = {
  name: string
  path: string
}

export type ScriptError = {
  err: string
}
export type CaptionOut = {
  filename: string
  tags: {
    tag: string
    rank: number
  }[]
} & ScriptError
export type SegOut = {
  current: number
  total: number
  path: string
  output: string
}

export type ProcessOutputEvent<T> = {
  message: string
  err?: string
  vars?: T
  event?: string
}
export type ImageGenerateOutVars = {
  path: string
  filename: string
  models: string[]
}
export type PretrainModel = {
  name: string
  path: string
}
export type ModelType = 'lora' |
  'LyCORIS/LoCon' |
  'LyCORIS/LoHa' |
  'LyCORIS/iA3' |
  'LyCORIS/DyLoRA' |
  'LyCORIS/LoKr'

export type SelectFileDialogParam = {
  title?: string,
  defaultPath?: string,
  multiple?: boolean
}
export type SelectFolderDialogParam = {
  title?: string,
  defaultPath?: string,
  multiple?: boolean
}
export type SavedProject = {
  name: string
}

export enum ChannelsKeys {
  selectFolder = 'select-folder',
  selectFiles = 'select-files',
  openDirectory = 'open-directory',
  saveConfig = 'save-config',
  readConfig = 'read-config',
  cloneSuccess = 'clone-success',
  cloneFail = 'clone-fail',
  preprocess = 'preprocess',
  interruptPreprocess = 'interrupt-preprocess',
  preprocessOut = 'preprocess-out',
  preprocessError = 'preprocess-error',
  preprocessDone = 'preprocess-done',
  preprocessExit = 'preprocess-exit',
  loadTagLibrary = 'load-tag-library',
  startTraining = 'start-training',
  createDataset = 'create-dataset',
  cloneTrainRepo = 'clone-train-repo',
  updateTrainRepo = 'update-train-repo',
  installTrainRepo = 'install-train-repo',
  interruptInstallTrainRepo = 'interrupt-install-train-repo',
  cloneRepoProgress = 'clone-repo-progress',
  openFolder = 'open-folder',
  openTrainer = 'open-trainer',
  openSplash = 'open-splash',
  openInstall = 'open-install',
  installDep = 'install-dep',
  installLog = 'install-log',
  getDefaultInstallPath = 'get-default-install-path',
  checkNeedInstall = 'check-need-install',
  openEditor = 'open-editor',
  closeInstall = 'close-install',
  closeSplash = 'close-splash',
  addLoraData = 'add-lora-data',
  getLoraPresetList = 'get-lora-data',
  removeLoraData = 'remove-lora-data',
  loadDataset = 'load-dataset',
  loadProject = 'load-project',
  saveProject = 'save-project',
  setInstallDir = 'set-install-dir',
  accelerateConfig = 'accelerate-config',
  loraSaved = 'lora-saved',
  loraGenerateImage2 = 'lora-generate-image2',
  getTrainConfigs = 'get-train-configs',
  saveTrainConfig = 'save-train-config',
  deleteTrainConfig = 'delete-train-config',
  textImageCallback = 'text-image-callback',
  trainProgress = 'train-progress',
  getTrainPreview = 'get-train-preview',
  savePreviewProps = 'save-preview-props',
  getPreviewProps = 'get-preview-props',
  loraGetModels = 'lora-get-models',
  loraDeleteModel = 'lora-delete-model',
  loraExportModel = 'lora-export-model',
  readTrainerSettings = 'read-trainer-settings',
  saveTrainerSettings = 'save-trainer-settings',
  exportLog = 'export-log',
  openLog = 'open-log',


  importImageFromFolder = 'import-image-from-folder',
  importImageFromFiles = 'import-image-from-files',

  makeCaption = 'make-caption',
  interruptMakeCaption = 'interrupt-make-caption',
  captionOut = 'caption-out',
  captionError = 'caption-error',
  captionStdError = 'caption-stdError',
  captionDone = 'caption-done',
  captionHistoryUpdate = 'caption-history-update',
  newProject = 'new-project',
  newPreprocessImageFile = 'new-preprocess-image-file',
  savePreprocessImage = 'save-preprocess-image',
  preprocessImageRemove = 'preprocess-image-remove',
  preprocessImageRemoveEvent = 'preprocess-image-remove-event',

  segAnimeCharacter = 'seg-anime-character',
  segAnimeCharacterInterrupt = 'seg-anime-character-interrupt',
  segAnimeCharacterOut = 'seg-anime-character-out',
  segAnimeCharacterStdErr = 'seg-anime-character-stdErr',
  segAnimeCharacterErr = 'seg-anime-character-err',

  importOriginImage = 'import-origin-image',
  importImageProcessEvent = 'import-image-process-event',

  trainerWindowResize = 'trainer-window-resize',
  trainWindowClose = 'train-window-close',
  trainerWindowHide = 'trainer-window-hide',

  startCheckDoctor = 'start-check-doctor',
  doctorCheckSuccess = 'doctor-check-success',
  doctorCheckFail = 'doctor-check-fail',

  getRecentOpenProjects = 'get-recent-open-projects',

  getPretrainModels = 'get-pretrain-models',
  openPretrainFolder = 'open-pretrain-folder',

  getStableDiffusionModelList = 'get-stable-diffusion-model-list',
  openStableDiffusionFolder = 'open-stable-diffusion-folder',
  generateImageError = 'generate-image-error',
  generateImageOut = 'generate-image-out',
  generateImageExit = 'generate-image-exit',
  interruptGenerateImage = 'interrupt-generate-image',
  updateLoraModel = 'update-lora-model',

  selectFolderDialog = 'select-folder-dialog',
  selectFileDialog = 'select-file-dialog',
  getIsRemoteMode = 'get-is-remote-mode',

  getProjectList = 'get-project-list',
}

export enum RemoteChannelsKeys {

}
