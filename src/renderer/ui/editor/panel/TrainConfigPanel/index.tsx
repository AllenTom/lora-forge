import { useFormik } from 'formik';
import { selectFolder } from '../../../../service/config';
import React, { Key, useEffect, useState } from 'react';
import { randomString } from '../../../../utils/string';
import {
  deleteTrainConfig,
  getLoraPresetList,
  getTrainConfigs,
  getTrainPreview,
  saveTrainConfig,
  startTraining
} from '../../../../service/training/train';
import { LorePreset, TrainConfig, TrainEnvContext, TrainingConfig, TrainParameter } from '../../../../../types';
import { useAtom } from 'jotai';
import { configAtom, ConfigState, currentConfigAtom, trainingContextAtom, updateConfigAtom } from '../../model';
import { getTrainParameterList } from '../../data';
import AddTrainParameterDialog from '../../components/AddTrainParameterDialog';
import ArgsPreviewDialog from '../../components/ArgsPreviewDialog';
import { createDataset } from '../../../../service/training/dataset';
import { useTranslation } from 'react-i18next';
import {
  ActionButton,
  ActionMenu,
  Button,
  Content,
  ContextualHelp,
  Divider,
  Flex,
  Heading,
  Item,
  Menu,
  MenuTrigger,
  Picker, Section,
  Slider,
  Switch,
  Text,
  TextField,
  Well
} from '@adobe/react-spectrum';
import Add from '@spectrum-icons/workflow/Add';
import Close from '@spectrum-icons/workflow/Close';
import { getPretrainedModelList } from '../../../../service/training/pretrained';
import Refresh from '@spectrum-icons/workflow/Refresh';
import { useConfirmation } from '../../../components/ConfirmDialog/provider';
import useProjectInspector from '../../hooks/ProjectInspector';
import Copy from '@spectrum-icons/workflow/Copy';
import Delete from '@spectrum-icons/workflow/Delete';
import { toast } from 'react-toastify';
import Play from '@spectrum-icons/workflow/Play';
import SaveFloppy from '@spectrum-icons/workflow/SaveFloppy';
import FolderOpen from '@spectrum-icons/workflow/FolderOpen';
import Layers from '@spectrum-icons/workflow/Layers';
import { selectFileDialog, selectFolderDialog } from '../../../../service/training/common';
const defaultModel = [
  'stabilityai/stable-diffusion-2-1-base',
  'stabilityai/stable-diffusion-2-base',
  'stabilityai/stable-diffusion-2-1',
  'stabilityai/stable-diffusion-2',
  'runwayml/stable-diffusion-v1-5',
  'CompVis/stable-diffusion-v1-4',
]
const TrainConfigPanel = () => {
  const confirm = useConfirmation();

  const { t } = useTranslation('translation', { keyPrefix: 'panels.trainConfig' });
  const TrainParameterList = getTrainParameterList(useTranslation('translation').t);

  const [profileList, setProfileList] = React.useState<LorePreset[]>([]);
  const [trainContext, setTrainContext] = useAtom(trainingContextAtom);
  const [configContext, setConfigContext] = useAtom(configAtom);
  const [_, updateConfigContext] = useAtom(updateConfigAtom);
  const inspector = useProjectInspector();
  const formikContext = useFormik<TrainConfig>({
    initialValues: {
      extraParams: {},
      modelType: 'lora'
    },
    onSubmit: async (values) => {
      if (!trainContext.datasetPath || !trainContext.datasetFolders || !trainContext.datasetSource) {
        return;
      }
      await createDataset(trainContext.datasetSource, trainContext.datasetFolders, trainContext.datasetPath);
      await startTraining(getTrainConfig());
    },
    validate: (values) => {
      updateConfigContext({
        config: values
      });
    }
  });
  const [currentConfig] = useAtom(currentConfigAtom);
  const [extraDialogOpen, setExtraDialogOpen] = React.useState(false);
  const [preview, setPreview] = useState<TrainEnvContext>();
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const getAvailableExtraOptions = () => {
    return getTrainParameterList;
  };
  const reloadConfig = async ({ opt = {} }: { opt?: Partial<ConfigState> }) => {
    const TrainConfigs = await getTrainConfigs();
    let index = 0;
    setConfigContext({
      ...configContext,
      list: TrainConfigs,
      currentConfigId: TrainConfigs.length > 0 ? TrainConfigs[0].name : undefined,
      ...opt
    });
  };
  const refreshPretrainedModelList = async () => {
    const pretrainedModels = await getPretrainedModelList();
    if (pretrainedModels) {
      updateConfigContext({
        pretrainedModels
      });
    }
  };
  const init = async () => {
    const savedProfiles = await getLoraPresetList();
    setProfileList(savedProfiles);
    refreshPretrainedModelList();
  };
  useEffect(() => {
    init();
  }, []);
  const getTrainConfig = (): TrainingConfig => {
    const values = formikContext.values;
    let profileArg = {};
    const useProfile = profileList.find((item) => item.name === values.loraPresetName);
    if (useProfile) {
      profileArg = useProfile.params;
    }
    let params = {
      ...profileArg,
      ...values.extraParams,
      pretrained_model_name_or_path: values.pretrained_model_name_or_path,
      train_data_dir: trainContext.datasetPath
    } as any;

    let args: any = {};
    switch (values.modelType) {
      case 'lora':
        args.network_module = 'networks.lora';
        break;
      case 'LyCORIS/LoCon':
        args.network_module = 'lycoris.kohya';
        args.network_args = `"conv_dim=${params.network_dim}" "conv_alpha=${params.network_alpha}" "algo=locon"`;
        break;
      case 'LyCORIS/LoHa':
        args.network_module = 'lycoris.kohya';
        args.network_args = `"conv_dim=${params.network_dim}" "conv_alpha=${params.network_alpha}" "algo=loha" "use_cp=${params.use_cp ?? false}"`;
        break;
      case 'LyCORIS/iA3':
        args.network_module = 'lycoris.kohya';
        args.network_args = `"conv_dim=${params.network_dim}" "conv_alpha=${params.network_alpha}" "algo=ia3" "train_on_input=${params.train_on_input ?? false}"`;

        break;
      case 'LyCORIS/DyLoRA':
        args.network_module = 'lycoris.kohya';
        args.network_args = `"conv_dim=${params.network_dim}" "conv_alpha=${params.network_alpha}" "algo=dylora" use_cp=${params.use_cp} "block_size=${params.block_size ?? 1}"`;
        break;
      case 'LyCORIS/LoKr':
        args.network_module = 'lycoris.kohya';
        args.network_args = `"conv_dim=${params.network_dim}" "conv_alpha=${params.network_alpha}" "algo=lokr" "factor=${params.factor}" "use_cp=${params.use_cp ?? false}"`;
        break;
      default:
        args.network_module = 'networks.lora';
    }
    delete params.use_cp;
    delete params.factor;
    delete params.train_on_input;
    delete params.block_size;

    params = {
      ...params,
      ...args
    };

    const config = {
      output_name: values.modelName,
      output_dir: trainContext.modelOutPath,
      params
    };
    return config;
  };
  const previewConfig = getTrainConfig();

  const onGetPreviewHandler = async () => {
    const config = getTrainConfig();
    const previewData = await getTrainPreview(config);
    setPreview(previewData);
    setIsPreviewDialogOpen(true);
  };
  const onCreateNewConfig = async () => {
    const id = randomString(6);
    const newConfig: TrainConfig = {
      id,
      name: id,
      extraParams: {},
      loraPresetName: 'default',
      pretrained_model_name_or_path: 'runwayml/stable-diffusion-v1-5'
    };
    await saveTrainConfig(newConfig);
    updateConfigContext({
      list: [
        ...configContext.list,
        newConfig
      ],
      currentConfigId: id
    });
  };
  useEffect(() => {
    if (currentConfig) {
      formikContext.resetForm({
        values: {
          extraParams: {},
          modelName: '',
          modelType: 'lora'
        }
      });
      console.log(currentConfig);
      formikContext.setValues({
        ...currentConfig,
        modelName: currentConfig.modelName ?? ''
      });
    }
  }, [currentConfig]);
  const onSaveConfig = async () => {
    if (!currentConfig) {
      return;
    }
    const config = formikContext.values;
    config.id = currentConfig.id;
    console.log(config);
    await saveTrainConfig(config);
    updateConfigContext({
      list: configContext.list.map(it => {
        if (it.id === config.id) {
          return config;
        }
        return it;
      })
    });
  };
  const getDisplayParameter = (): TrainParameter[] => {
    const values = formikContext.values.extraParams;
    if (!values) {
      return [];
    }
    const keys = Object.keys(values);
    const res: TrainParameter[] = [];
    keys.forEach(key => {
      let targetParam = TrainParameterList.find(it => it.name === key);
      if (!targetParam) {
        targetParam = getAdditionalParams().find(it => it.name === key);
      }
      if (targetParam) {
        res.push(targetParam);
      }
    });
    return res;
  };
  const onAddParameter = (params: TrainParameter[]) => {
    const newValues: any = {};
    params.forEach(it => {
      newValues[it.name] = it.default;
    });
    formikContext.setValues({
      ...formikContext.values,
      extraParams: {
        ...formikContext.values.extraParams,
        ...newValues
      }
    });
  };
  const onDeleteConfig = async (id: string) => {
    if (configContext.list.length === 1) {
      toast.error(t('atLeaseOneConfig'), {
        position: "bottom-center",
        autoClose: 1000,
        closeOnClick: true,
        pauseOnHover: true,
        theme: "dark",
        hideProgressBar:true,
        closeButton:false,
      });
      return
    }
    const config = configContext.list.find(it => it.id === id);
    if (!config) {
      return;
    }
    confirm({
      title: t('deleteConfigTitle'),
      description: t('deleteConfigMessage', {
        name: config.name
      }),
      variant: 'destructive',
      onConfirm: async () => {
        await deleteTrainConfig(id);
        // move to current index - 1
        const currentIndex = configContext.list.findIndex(it => it.id === id);
        let newIndex = currentIndex - 1;
        if (newIndex < 0) {
          newIndex = 0;
        }
        const newConfigId = configContext.list[newIndex].id;
        await reloadConfig({
          opt:{
            currentConfigId: newConfigId
          }
        });
      }
    });
    // await deleteTrainConfig(id);
    // await reloadConfig();
  };
  const onDuplicateConfig = async (id: string) => {
    const config = configContext.list.find(it => it.id === id);
    if (!config) {
      return;
    }
    const newId = randomString(6);
    let newName = config.name;
    while (configContext.list.find(it => it.name === newName)) {
      newName = `${config.name}(${randomString(3)})`;
    }
    const newConfig = {
      ...config,
      name: newName,
      id: newId
    };
    await saveTrainConfig(newConfig);
    updateConfigContext({
      list: [
        ...configContext.list,
        newConfig
      ],
      currentConfigId: newId
    });
  };
  const validateList = inspector.getValidateCheck();
  const recommendedList = inspector.getRecommendedCheck();
  const getAdditionalParams = (): TrainParameter[] => {
    const additionalParams: TrainParameter[] = [];
    switch (formikContext.values.modelType) {
      case 'LyCORIS/LoHa':
        additionalParams.push({
          name: 'use_cp',
          type: 'boolean',
          default: false,
          description: 'A two-step approach utilizing tensor decomposition and fine-tuning to accelerate convolution layers in large neural networks, resulting in significant CPU speedups with minor accuracy drops.'
        });
        break;
      case 'LyCORIS/iA3':
        additionalParams.push({
          name: 'train_on_input',
          type: 'boolean',
          default: true,
          description: 'iA3 train on input'
        });
        break;
      case 'LyCORIS/DyLoRA':
        additionalParams.push({
          name: 'block_size',
          type: 'integer',
          default: 1,
          description: 'block size'
        });
        additionalParams.push({
          name: 'use_cp',
          type: 'boolean',
          default: false,
          description: 'A two-step approach utilizing tensor decomposition and fine-tuning to accelerate convolution layers in large neural networks, resulting in significant CPU speedups with minor accuracy drops.'
        });
        break;
      case 'LyCORIS/LoKr':
        additionalParams.push({
          name: 'factor',
          description: 'LoKr factor',
          default: -1,
          type: 'integer'
        });
        break;
    }
    return additionalParams;
  };
  const onConfigAction = (key: string, item: TrainConfig) => {
    switch (key) {
      case 'delete':
        onDeleteConfig(item.id!);
        break;
      case 'duplicate':
        onDuplicateConfig(item.id!);
        break;
    }

  };
  const onFromLocalAction = async (key:Key) => {
    switch (key.toString()) {
      case 'selectFolder':
        const paths = await selectFolderDialog({})
        if (paths) {
          formikContext.setFieldValue('pretrained_model_name_or_path', paths[0]);
        }
        break
      case 'selectFile':
        const path = await selectFileDialog({})
        if (path) {
          formikContext.setFieldValue('pretrained_model_name_or_path', path[0]);
        }
        break
      default:
        if (defaultModel.includes(key.toString())) {
          formikContext.setFieldValue('pretrained_model_name_or_path', key.toString());
        }
    }
  }
  return (
    <>
      <AddTrainParameterDialog
        isOpen={extraDialogOpen}
        onAdd={onAddParameter}
        onClose={() => {
          setExtraDialogOpen(false);
        }}
        excludeParams={getDisplayParameter().map(it => it.name)}
        additionalParams={getAdditionalParams()}
      />
      <ArgsPreviewDialog
        isOpen={isPreviewDialogOpen}
        data={preview}
        onClose={() => {
          setIsPreviewDialogOpen(false);
        }}
      />
      <div
        style={{
          display: 'flex',
          height: '100%',
          gap: 16,
          paddingLeft: 8,
          paddingTop: 16,
          paddingRight: 8,
          paddingBottom: 16,
          boxSizing: 'border-box'
        }}
      >
        <Well
          UNSAFE_style={{
            width: 160,
            display: 'block'
          }}>
          {
            t('trainConfig')
          }
          {
            configContext.list.map(it => {
              return (
                <div key={it.name} style={{
                  marginTop: 8,
                  width: '100%',
                  display: 'flex',
                  backgroundColor: configContext.currentConfigId === it.id ? '#008252' : '#202020',
                  alignItems: 'center',
                  cursor: 'pointer',
                  paddingLeft: 8, paddingRight: 8,
                  boxSizing: 'border-box',
                  borderRadius: 4
                }}>
                  <div
                    style={{
                      flex: 1,
                      lineBreak: 'anywhere'
                    }}
                    onClick={() => {
                      setConfigContext({
                        ...configContext,
                        currentConfigId: it.id
                      });
                    }}
                  >
                    {it.name}
                  </div>
                  <ActionMenu
                    isQuiet={true}
                    UNSAFE_style={{
                      backgroundColor: 'transparent',
                      border: 'none'
                    }}
                    onAction={(key) => {
                      onConfigAction(key.toString(), it);
                    }}
                  >
                    <Item key={'delete'}><Text><Delete />{t('delete')}</Text></Item>
                    <Item key={'duplicate'}><Text><Copy />{t('duplicate')}</Text></Item>
                  </ActionMenu>
                  {/*<ActionButton*/}
                  {/*  isQuiet*/}
                  {/*  onPress={() => onDeleteConfig(it.id!)}*/}
                  {/*>*/}
                  {/*  <Close size={'S'} />*/}
                  {/*</ActionButton>*/}

                </div>
              );
            })
          }
          <div>
            <ActionButton width={'100%'} onPress={onCreateNewConfig} marginTop={16} isQuiet>
              <Add size={'S'} marginEnd={8} />
              {t('newConfig')}
            </ActionButton>
          </div>

        </Well>

        <Well UNSAFE_style={{
          flex: 1,
          position: 'relative',
          padding: 0
        }}>
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            padding: 16,
            overflow: 'auto',
            boxSizing: 'border-box'
          }}>
            {
              configContext.currentConfigId && (
                <Flex direction={'column'} gap={16}>
                  <TextField
                    width={'100%'}
                    label={t('name')}
                    value={formikContext.values.name}
                    onChange={(v) => {
                      formikContext.setFieldValue('name', v);
                    }}
                  />
                  <Picker
                    label={t('modelType')}
                    width={'100%'}
                    selectedKey={formikContext.values.modelType}
                    onSelectionChange={(key) => {
                      formikContext.setFieldValue('modelType', key.toString());
                    }}
                  >
                    {/*{*/}
                    {/*  export type ModelType = 'lora' |*/}
                    {/*  'LyCORIS/LoCon' |*/}
                    {/*  'LyCORIS/LoHa' |*/}
                    {/*  'LyCORIS/iA3' |*/}
                    {/*  'LyCORIS/DyLoRA' |*/}
                    {/*  'LyCORIS/LoKr'*/}
                    {/*}*/}
                    <Item key={'lora'}>Lora</Item>
                    <Item key={'LyCORIS/LoCon'}>LyCORIS/LoCon</Item>
                    <Item key={'LyCORIS/LoHa'}>LyCORIS/LoHa</Item>
                    <Item key={'LyCORIS/iA3'}>LyCORIS/iA3</Item>
                    <Item key={'LyCORIS/DyLoRA'}>LyCORIS/DyLoRA</Item>
                    <Item key={'LyCORIS/LoKr'}>LyCORIS/LoKr</Item>


                  </Picker>
                  <Picker
                    label={t('presetName')}
                    width={'100%'}
                    selectedKey={formikContext.values.loraPresetName}
                    onSelectionChange={(key) => {
                      formikContext.setFieldValue('loraPresetName', key.toString());
                    }}
                  >
                    {
                      profileList.map((item) => {
                        return <Item key={item.name}>{item.name}</Item>;
                      })
                    }
                  </Picker>
                  <TextField
                    label={t('modelName')}
                    value={formikContext.values.modelName}
                    onChange={(e) => {
                      formikContext.setFieldValue('modelName', e);
                    }}
                    width={'100%'}
                    validationState={validateList['modelName'] ? 'invalid' : 'valid'}
                    errorMessage={validateList['modelName']}
                  />

                  <div>
                    <div>
                      {t('pretrainModelNameOrPath')}
                    </div>
                    <Flex gap={16}>
                      <TextField
                        flex={1}
                        value={formikContext.values.pretrained_model_name_or_path}
                        onChange={(e) => {
                          formikContext.setFieldValue('pretrained_model_name_or_path', e);
                        }}
                      />

                      <MenuTrigger>
                        <ActionButton>
                          {t('selectModel')}
                        </ActionButton>
                        <Menu onAction={onFromLocalAction}>
                          <Section title={t('fromLocal')}>
                            <Item key="selectFolder">
                              <FolderOpen />
                              <Text>
                                {t('selectFolder')}
                              </Text>
                            </Item>
                            <Item key="selectFile">
                              <Layers />
                              <Text>
                                {t('selectFile')}
                              </Text>
                            </Item>
                          </Section>
                          <Section title={t('preset')}>
                            {
                              defaultModel.map((item) => {
                                return (
                                  <Item key={item}>{item}</Item>
                                );
                              })
                            }
                          </Section>
                        </Menu>
                      </MenuTrigger>

                      {/*<ActionButton*/}
                      {/*  onPress={async () => {*/}
                      {/*    const selectedPath = await selectFolder({ title: t('selectPretrainModel') });*/}
                      {/*    if (selectedPath) {*/}
                      {/*      await formikContext.setFieldValue('pretrained_model_name_or_path', selectedPath);*/}
                      {/*    }*/}
                      {/*  }}*/}
                      {/*>*/}
                      {/*  {t('fromLocal')}*/}
                      {/*</ActionButton>*/}
                      <Divider orientation={'vertical'} width={1} />
                      <Flex gap={4}>
                        <MenuTrigger>
                          <ActionButton>
                            {t('pretrainModelLibrary')}
                          </ActionButton>

                          <Menu onAction={(key) => {
                            formikContext.setFieldValue('pretrained_model_name_or_path', key.toString());
                          }}>
                            {
                              configContext.pretrainedModels.map((item) => {
                                return (
                                  <Item key={item.path}>{item.name}</Item>
                                );
                              })
                            }
                          </Menu>

                        </MenuTrigger>
                        <ActionButton onPress={refreshPretrainedModelList}>
                          <Refresh />
                        </ActionButton>
                      </Flex>
                    </Flex>
                  </div>
                  <div style={{
                    marginBottom: 64
                  }}>
                    {
                      t('extraParams')
                    }
                    <Flex
                      direction={'column'}
                      gap={8}
                    >
                      {
                        getDisplayParameter().map(param => {
                          const getFormInput = () => {
                            if (param.choices) {
                              return (
                                <Picker
                                  label={
                                    <div style={{
                                      fontSize: 14,
                                      marginBottom: 4
                                    }}>
                                      {param.name}
                                    </div>
                                  }
                                  flex={1}
                                  selectedKey={formikContext.values.extraParams[param.name]}
                                  onSelectionChange={(e) => {
                                    formikContext.setFieldValue(`extraParams.${param.name}`, e.toString());
                                  }}
                                  contextualHelp={
                                    <ContextualHelp variant='info'>
                                      <Heading>{param.name}</Heading>
                                      <Content>
                                        {param.description}
                                      </Content>
                                    </ContextualHelp>
                                  }
                                >
                                  {
                                    param.choices.map((item) => {
                                      return (
                                        <Item key={item}>{item}</Item>
                                      );
                                    })
                                  }

                                </Picker>

                              );
                            }
                            if (param.num) {
                              return (
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    flex: 1,
                                    gap: 16
                                  }}
                                >
                                  <Slider
                                    flex={1}
                                    label={
                                      <div style={{
                                        fontSize: 14,
                                        marginBottom: 4
                                      }}>
                                        {param.name}

                                      </div>
                                    }
                                    value={formikContext.values.extraParams[param.name]}
                                    step={param.num.step}
                                    maxValue={param.num.max}
                                    minValue={param.num.min}
                                    onChange={(e) => {
                                      formikContext.setFieldValue(`extraParams.${param.name}`, e);
                                    }}
                                    contextualHelp={
                                      <ContextualHelp variant='info'>
                                        <Heading>{param.name}</Heading>
                                        <Content>
                                          {param.description}
                                        </Content>
                                      </ContextualHelp>
                                    }
                                    showValueLabel={false}
                                  />
                                  <TextField
                                    value={formikContext.values.extraParams[param.name]}
                                    onChange={(e) => {
                                      formikContext.setFieldValue(`extraParams.${param.name}`, e);
                                    }}
                                  />


                                </div>
                              );
                            }
                            switch (param.type) {
                              case 'folder':
                              case 'string':
                                return (
                                  <TextField
                                    label={
                                      <div style={{
                                        fontSize: 14,
                                        marginBottom: 4
                                      }}>
                                        {param.name}
                                        <ContextualHelp variant='info'>
                                          <Heading>{param.name}</Heading>
                                          <Content>
                                            {param.description}
                                          </Content>
                                        </ContextualHelp>
                                      </div>
                                    }
                                    flex={1}
                                    value={formikContext.values.extraParams[param.name]}
                                    onChange={(e) => {
                                      formikContext.setFieldValue(`extraParams.${param.name}`, e);
                                    }}
                                    validationState={validateList[param.name] ? 'invalid' : 'valid'}
                                    errorMessage={validateList[param.name]}
                                  />
                                );
                              case 'float':
                              case 'integer':
                              case 'number':
                                return (
                                  <TextField
                                    flex={1}
                                    label={
                                      <div style={{
                                        fontSize: 14,
                                        marginBottom: 4
                                      }}>
                                        {param.name}

                                      </div>
                                    }
                                    value={formikContext.values.extraParams[param.name]}
                                    onChange={(e) => {
                                      formikContext.setFieldValue(`extraParams.${param.name}`, e);
                                    }}
                                    validationState={validateList[param.name] ? 'invalid' : 'valid'}
                                    errorMessage={validateList[param.name]}
                                    contextualHelp={
                                      <ContextualHelp variant='info'>
                                        <Heading>{param.name}</Heading>
                                        <Content>
                                          {param.description}
                                        </Content>
                                      </ContextualHelp>
                                    }
                                  />
                                );
                              case 'boolean':
                                return (
                                  <div style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}>
                                    <Switch
                                      isSelected={formikContext.values.extraParams[param.name]}
                                      onChange={(e) => {
                                        formikContext.setFieldValue(`extraParams.${param.name}`, e);
                                      }}
                                    >
                                      {param.name}
                                    </Switch>
                                    <div style={{ flex: 1 }}>
                                      <ContextualHelp variant='info'>
                                        <Heading>{param.name}</Heading>
                                        <Content>
                                          {param.description}
                                        </Content>
                                      </ContextualHelp>
                                    </div>
                                  </div>

                                );
                            }
                          };
                          return (
                            <div style={{}}>
                              <Flex gap={16} alignItems={'start'}>
                                {
                                  getFormInput()
                                }
                                <ActionButton
                                  isQuiet
                                  onPress={() => {
                                    formikContext.setFieldValue(`extraParams.${param.name}`, undefined);
                                  }}
                                >
                                  <Close size={'S'} />
                                </ActionButton>
                              </Flex>
                              <div style={{
                                color: '#ce8e2c'
                              }}>
                                {recommendedList[param.name]}
                              </div>
                            </div>

                          );

                        })
                      }
                    </Flex>
                    <div>
                    </div>

                  </div>
                </Flex>
              )
            }
          </div>
          <Flex position={'absolute'}
                bottom={0}
                width={'100%'}
                gap={16}
                left={0}
                zIndex={999}
                UNSAFE_style={{
                  backgroundColor: '#202020',
                  padding: 16,
                  boxSizing: 'border-box',
                  justifyContent: 'flex-end'
                }}>
            <Button onPress={onGetPreviewHandler} variant={'primary'}>
              {t('previewArgs')}
            </Button>
            <Button onPress={() => setExtraDialogOpen(true)} variant={'primary'}>
              {t('addExtraParams')}
            </Button>
            <Button onPress={onSaveConfig} variant={'primary'}>
              <SaveFloppy />
              <Text>
                {t('save')}
              </Text>
            </Button>
            {/*<Button colorScheme={'green'} onClick={props.submitForm}>*/}
            {/*  保存训练配置并启动*/}
            {/*</Button>*/}
            <Button onPress={formikContext.submitForm} variant={'accent'}>
              <Play />
              <Text>
                {t('launch')}
              </Text>
            </Button>
          </Flex>
        </Well>
        <Well
          UNSAFE_style={{
            display: 'flex',
            flexDirection: 'column',
            width: 280,
            padding: 0
          }}
        >
          <div
            style={{
              padding: 16
            }}
          >
            {t('preview')}
          </div>
          <div
            style={{
              position: 'relative',
              flex: 1
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflowY: 'auto',
                padding: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              {
                Object.keys(previewConfig?.params ?? {}).map(key => {
                  return (
                    <div style={{
                      padding: 8,
                      backgroundColor: '#202020'

                    }}>
                      <div style={{
                        whiteSpace: 'break-spaces',
                        wordWrap: 'break-word',
                        color: '#a6a6a6',
                        marginBottom: 4
                      }}>
                        {key}
                      </div>
                      <div
                        style={{
                          whiteSpace: 'break-spaces',
                          wordWrap: 'break-word'
                        }}
                      >
                        {previewConfig?.params[key]}
                      </div>
                    </div>


                  );
                })
              }
            </div>
          </div>
        </Well>
      </div>

    </>


  );
};

export default TrainConfigPanel;
