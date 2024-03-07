import { useAtom } from 'jotai';
import {
  currentOriginalAtom,
  currentOriginalPreprocessImageAtom,
  originalAtom,
  trainingContextAtom,
  updateOriginalAtom,
  updateTrainingContextAtom
} from '../../model';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import CropImageDialog, { SaveEditValues } from '../../components/CropImageDialog';
import { Button, Item, Picker, Well } from '@adobe/react-spectrum';
import { savePreprocessImage } from '../../../../service/training/preprocess';
import { useFormik } from 'formik';

type OriginalFilter = {
  relativePreprocess:"any" | "nothing" | "atLeastOne" | "moreThanOne"
}
const OriginalPanel = () => {
  const [trainContext] = useAtom(trainingContextAtom);
  const [__, updateTrainContext] = useAtom(updateTrainingContextAtom);
  const [currentOriginalImage, ___] = useAtom(currentOriginalAtom);
  const [originalContext] = useAtom(originalAtom);
  const [_, updateOriginalContext] = useAtom(updateOriginalAtom);
  const [currentPreprocessImages] = useAtom(currentOriginalPreprocessImageAtom);
  const { t } = useTranslation('translation', { keyPrefix: 'panels.original' });
  const [cropImageSrc, setCropImageSrc] = useState<string | undefined>(undefined);
  const [cropImageDialogOpen, setCropImageDialogOpen] = useState(false);
  const formik = useFormik<OriginalFilter>({
    initialValues: {
      relativePreprocess: "any"
    },
    onSubmit: (values) => {

    }
  });
  const onCropImage = (src: string) => {
    setCropImageSrc(src);
    setCropImageDialogOpen(true);
  };
  const onSaveImage = async (values: SaveEditValues) => {
    await savePreprocessImage({
      sourceImageFileName: currentOriginalImage!.fileName!,
      base64Data: values.imageBase64
    });
    setCropImageDialogOpen(false);
  };
  const getCropAspect = () => {
    if (trainContext.projectParams) {
      return trainContext.projectParams.width / trainContext.projectParams.height;
    }
    return 1;
  };
  const getOriginalImages = () => {
    let images = trainContext.originalImage ?? [];
    if (formik.values.relativePreprocess) {
      const preprocessImages = trainContext.datasetSource ?? [];
      images = images.filter(it => {
        switch (formik.values.relativePreprocess) {
          case "any":
            return true;
          case "nothing":
            return !preprocessImages.find(p => p.originalPath === it.src);
          case "atLeastOne":
            return preprocessImages.find(p => p.originalPath === it.src);
          case "moreThanOne":
            return preprocessImages.filter(p => p.originalPath === it.src).length > 1;

        }
      });
    }
    return images
  }
  return (
    <div
      style={{
        padding: 16,
        height: '100%',
        boxSizing:'border-box'
      }}
    >
      <CropImageDialog
        isOpen={cropImageDialogOpen}
        onClose={() => setCropImageDialogOpen(false)}
        src={cropImageSrc}
        onSaved={onSaveImage}
        aspect={getCropAspect()}
      />
      <div style={{
        display: 'flex',
        gap: 16,
        height: '100%'
      }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              width: '100%',
              marginBottom: 16
            }}
          >
            <Well>
              <Picker
                label={t('preprocess')}
                selectedKey={formik.values.relativePreprocess}
                onSelectionChange={(key) => {
                  formik.setFieldValue('relativePreprocess', key.toString());
                }}
              >
                <Item key={'any'}>{t("any")}</Item>
                <Item key={'nothing'}>{t("nothing")}</Item>
                <Item key={'atLeastOne'}>{t("atLeastOne")}</Item>
                <Item key={'moreThanOne'}>{t("moreThanOne")}</Item>
              </Picker>
            </Well>

          </div>
          <div style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            flex: 1,
            alignContent: 'flex-start',
            overflowY: 'auto'
          }}>
            {
              (getOriginalImages() ?? []).map((item, index) => {
                return (
                  <div
                    key={item.hash}
                    style={{
                      padding: 8,
                      backgroundColor: '#202020'
                    }}
                    onClick={() => {
                      console.log(item);
                      updateOriginalContext({
                        currentOriginalHash: item.hash
                      });
                    }}
                  >
                    <img
                      src={`file:///${item.thumbnail}`}
                      style={{
                        objectFit: 'contain',
                        width: 120,
                        height: 120
                      }}
                    />
                  </div>
                );

              })
            }

          </div>
        </div>

        <Well
          UNSAFE_style={{
            width: 480,
            padding: 16,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {
            currentOriginalImage && (
              <>
                <img src={`file:///${currentOriginalImage.src}`} style={{
                  width: '100%',
                  height: 240,
                  objectFit: 'contain'
                }} />
                <div
                  style={{
                    marginTop: 16,
                    marginBottom: 8
                  }}
                >
                  {t('preprocessImages')}
                </div>
                <div style={{
                  width: '100%',
                  flex: 1,
                  flexWrap: 'wrap',
                  gap: 8,
                  display: 'flex',
                  alignContent: 'flex-start'

                }}>
                  {
                    currentPreprocessImages.map((item, index) => {
                      return (
                        <div>
                          <img src={`file:///${item.imagePath}`} style={{
                            width: 120,
                            height: 120,
                            objectFit: 'contain'
                          }} />
                        </div>
                      );
                    })
                  }
                </div>
                <Button variant={'primary'} onPress={() => onCropImage(currentOriginalImage.src)}>
                  {t('cropImage')}
                </Button>
              </>
            )
          }
        </Well>
      </div>

    </div>
  );
};

export default OriginalPanel;
