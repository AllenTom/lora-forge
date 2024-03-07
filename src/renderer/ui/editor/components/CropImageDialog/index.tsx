import { Button, Content, Dialog, DialogContainer, Flex, Heading, Slider, Switch, Well } from '@adobe/react-spectrum';
import { useTranslation } from 'react-i18next';
import { Crop, PixelCrop, ReactCrop } from 'react-image-crop';
import { useEffect, useRef, useState } from 'react';
import 'react-image-crop/dist/ReactCrop.css';
import { useDebounce } from 'ahooks';

export type SaveEditValues = {
  crop: Crop,
  rotate: number
  imageBase64: string
}
export type CropImageDialogProps = {
  isOpen: boolean,
  onClose: () => void,
  src?: string
  onSaved?: (data: SaveEditValues) => void,
  aspect?: number
}
const TO_RADIANS = Math.PI / 180;

export async function canvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop,
  {
    flip,
    rotate = 0,
    scale = 1,
  }:{
    flip?: boolean,
    rotate?: number,
    scale?: number
  }
) {
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  // devicePixelRatio slightly increases sharpness on retina devices
  // at the expense of slightly slower render times and needing to
  // size the image back down if you want to download/upload and be
  // true to the images natural size.
  // const pixelRatio = window.devicePixelRatio;
  const pixelRatio = 1

  canvas.width   = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  const rotateRads = rotate * TO_RADIANS;
  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  console.log({
    pixelRatio,
    cropX,
    cropY,
    centerX,
    centerY,
    imageNaturalWidth: image.naturalWidth,
    imageNaturalHeight: image.naturalHeight,
    imageWidth: image.width,
    imageHeight: image.height,
  })
  ctx.save();
  ctx.fillRect(-cropX,-cropY,centerX,centerY);


  // 5) Move the crop origin to the canvas origin (0,0)
  ctx.translate(-cropX, -cropY);
  // 4) Move the origin to the center of the original position
  ctx.translate(centerX, centerY);
  // 3) Rotate around the origin
  ctx.rotate(rotateRads);
  if (flip) {
    ctx.scale(-1, 1);
  }
  // 2) Scale the image
  ctx.scale(scale, scale);
  // 1) Move the center of the image to the origin (0,0)
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight
  );

  ctx.restore();
}

const CropImageDialog = (
  {
    isOpen,
    onClose,
    src,
    onSaved,
    aspect
  }: CropImageDialogProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'dialogs.cropImage' });
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const displayCrop = useDebounce(completedCrop, { wait: 100 });
  const [rotate, setRotate] = useState(0);
  const displayRotate = useDebounce(rotate, { wait: 100 });
  const [flip, setFlip] = useState(false);
  useEffect(() => {
    if (!displayCrop || !previewCanvasRef.current || !imgRef.current) {
      return;
    }
    canvasPreview(imgRef.current, previewCanvasRef.current, displayCrop,{
      rotate: displayRotate,
      flip,
    });
  }, [displayCrop, displayRotate,flip]);
  const onSave = () => {
    if (!crop || !imgRef.current || !previewCanvasRef.current) {
      return;
    }
    const canvas = previewCanvasRef.current;
    const base64 = canvas.toDataURL('image/png');
    console.log(completedCrop)
    onSaved?.({
      crop: crop,
      rotate: displayRotate,
      imageBase64: base64
    })
  }
  useEffect(() => {
    if (!isOpen) {
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  },[isOpen])
    return (
      <DialogContainer onDismiss={onClose} isDismissable>
        {
          isOpen && (
            <Dialog width={'70vw'} height={'90vh'} position={'relative'}>
              <Heading>{t('title')}</Heading>
              <Content marginTop={16} position={'relative'}>
                <Flex gap={16} alignItems={'center'}>
                  <div
                    style={{
                      height: '70vh',
                      overflowY: 'auto'
                    }}
                  >
                    <ReactCrop
                      crop={crop}
                      onChange={c => setCrop(c)}
                      aspect={aspect}
                      onComplete={(c) => setCompletedCrop(c)}
                    >
                      <img
                        src={src}
                        width={520}
                        style={{
                          objectFit: 'contain'
                        }}
                        ref={imgRef}
                      />
                    </ReactCrop>
                  </div>
                  <Well
                    UNSAFE_style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      height: '70vh'
                    }}>
                    {
                      displayCrop && (
                        <>
                          <div
                            style={{
                              flex: 1,
                              justifyContent: 'center',
                              alignItems: 'center',
                              display: 'flex',
                            }}
                          >
                            <canvas
                              ref={previewCanvasRef}
                              style={{
                                objectFit: 'contain',
                                width: '80%'
                              }}
                            />
                          </div>
                          <Flex width={'100%'} gap={16} wrap={'wrap'} UNSAFE_style={{
                            display: 'none',
                          }}>

                            <Slider
                              label={t('rotate')}
                              value={rotate}
                              onChange={setRotate}
                              minValue={0}
                              maxValue={360}
                              step={1}
                              defaultValue={0}
                              flex={1}
                            />
                            <Switch
                              isSelected={flip}
                              onChange={setFlip}
                              flexBasis={"100%"}
                            >
                              {
                                t('flip')
                              }
                            </Switch>
                          </Flex>
                        </>
                      )
                    }
                  </Well>
                </Flex>

              </Content>
              <Flex justifyContent={'end'} gap={16} position={'absolute'} end={32} bottom={32} UNSAFE_style={{
                backgroundColor: '#202020'
              }}>
                <Button variant={'accent'} onPress={onSave}>
                  {
                    t('save')
                  }
                </Button>
                <Button variant={'primary'} onPress={onClose}>
                  {
                    t('cancel')
                  }
                </Button>
              </Flex>
            </Dialog>
          )
        }
      </DialogContainer>
  );
};
export default CropImageDialog;
