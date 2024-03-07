import { useAtom } from 'jotai';
import { configAtom, currentConfigAtom, trainingContextAtom } from '../model';
import { getTrainParameterList } from '../data';
import { useTranslation } from 'react-i18next';

export type InspectorAction = {
  name: string,
  action: () => void
}
export type InspectorItem = {
  type: 'error' | 'info' | 'warning',
  title: string,
  message: string,
  extra?: any,
  event?: 'noCaption' | 'default',
  scope: 'dataset' | 'config',
  actions?: InspectorAction[]
}
const useProjectInspector = () => {
  const [trainContext, setTrainContext] = useAtom(trainingContextAtom);
  const [currentConfigContext, _] = useAtom(currentConfigAtom);
  const [configContext, setConfigContext] = useAtom(configAtom);

  const { t } = useTranslation();
  const TrainParameterList = getTrainParameterList(t);
  const getValidateCheck = () => {
    const result: { [key: string]: string } = {};
    const config = configContext.config ?? currentConfigContext;
    if (!config) {
      return result;
    }
    const trainParam: any = config?.extraParams ?? {};
    Object.keys(trainParam).map(key => {
      const param = TrainParameterList.find(it => it.name === key);
      if (param) {
        if (param.validate) {
          for (let validateRule of param.validate) {
            if (!validateRule.validate(trainParam[key], trainParam)) {
              result[key] = validateRule.messageRender(trainParam[key], trainParam);
              break;
            }
          }
        }
      }
    });

    if (!config.modelName || config.modelName === '') {
      result.modelName = t('validate.modelNameIsEmpty');
    }
    return result;
  };
  const getRecommendedCheck = () => {
    const result: { [key: string]: string } = {};
    const trainParam: any = configContext.config?.extraParams ?? currentConfigContext?.extraParams ?? {};
    Object.keys(trainParam).map(key => {
      const param = TrainParameterList.find(it => it.name === key);
      if (param) {
        if (param.recommendation) {
          for (let recommendationRule of param.recommendation) {
            if (!recommendationRule.validate(trainParam[key], trainParam)) {
              result[key] = recommendationRule.messageRender(trainParam[key], trainParam);
              break;
            }
          }
        }
      }
    });
    return result;
  };
  const check = () => {
    const items: InspectorItem[] = [];
    if (trainContext.datasetFolders) {
      if (trainContext.datasetFolders.length === 0) {
        items.push({
          type: 'error',
          title: t('validate.atLeastOneDatasetFolder'),
          message: t('validate.atLeastOneDatasetFolderDesc'),
          event: 'default',
          scope: 'dataset'
        });
      }
    }
    const configValidateResult = getValidateCheck();
    Object.keys(configValidateResult).forEach(key => {
      items.push({
        type: 'error',
        title: t('validate.configValueError', {
          val: key

        }),
        message: configValidateResult[key],
        event: 'default',
        scope: 'config'
      });
    });

    // precess item but no caption
    if (trainContext.datasetFolders) {
      const folders = trainContext.datasetFolders;
      const datasource = trainContext.datasetSource ?? [];
      for (let folder of folders) {
        const imageItem = datasource.filter(it => folder.images.includes(it.imagePath));
        for (let item of imageItem) {
          if (!item.captions || item.captions.length === 0) {
            items.push({
              type: 'warning',
              title: t("validate.datasetWarning"),
              message: t('validate.noCaptionWarring'),
              event: 'noCaption',
              extra: {
                item,
                folder
              },
              scope: 'dataset'
            });
          }
        }
      }
    }
    // no preprocess item
    if (trainContext.datasetSource) {
      if (trainContext.datasetSource.length === 0) {
        items.push({
          type: 'error',
          title: t("validate.datasetError"),
          message: t('validate.noDatasetError'),
          event: 'default',
          scope: 'dataset'
        });
      }
    }

    return items;
  };
  return {
    check, getValidateCheck, getRecommendedCheck
  };
};
export default useProjectInspector;
