import TrainingWatchOverPanel from '../../components/TrainingWatchOverPanel';
import { useAtom } from 'jotai';
import { currentOutputModelAtom, monitorAtom } from '../../model';
import { useEffect } from 'react';
import { ipcRenderer } from '../../../../service/base';
import { ChannelsKeys, UpdateTrainStatusRequest } from '../../../../../types';
import { useTranslation } from 'react-i18next';
import { ProgressBar, Well } from '@adobe/react-spectrum';
import Layers from '@spectrum-icons/workflow/Layers';

const TrainingPanel = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'panels.monitor' });
  const [monitorContext,updateMonitorData] = useAtom(monitorAtom);
  const [currentOutputModel] = useAtom(currentOutputModelAtom);
  useEffect(() => {
    ipcRenderer.on(ChannelsKeys.trainProgress, (data: UpdateTrainStatusRequest) => {
      console.log(data)
      updateMonitorData({
        ...monitorContext,
        currentState: data.status,
      } as any);
    });
    return () => {
      ipcRenderer.removeAllListeners(ChannelsKeys.trainProgress);
    };
  }, [monitorContext]);
  const getEpochProgress = () => {
    if (monitorContext && monitorContext.currentState) {
      const { currentState } = monitorContext;
      const { epoch, total_epoch } = currentState;
      if (total_epoch > 0){
        return (epoch / total_epoch) * 100
      }
    }
    return 0;
  }
  const getStepProgress = () => {
    if (monitorContext && monitorContext.currentState) {
      const { currentState } = monitorContext;
      const { step, total_step } = currentState;
      if (total_step > 0){
        return (step / total_step) * 100
      }
    }
    return 0;
  }

  return (
    <>
      <div
        style={{
          display:'flex',
          height:"100%",
          gap:16,
          padding:16,
          boxSizing:'border-box'
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap:16
          }}
        >
          <Well>
            <div>
              {
                t('status')
              }
            </div>
            <div>
              <div>
                epoch
                <div style={{
                  display:'flex',
                  alignItems:'center'
                }}>
                  <ProgressBar UNSAFE_style={{ flex:1,marginRight:16 }} value={getEpochProgress()} />
                  <div style={{ width:180,textAlign:'right' }}>
                    {monitorContext.currentState?.epoch} / {monitorContext.currentState?.total_epoch} ({getEpochProgress().toFixed(2)}%)
                  </div>
                </div>
              </div>
              <div>
                step
                <div style={{
                  display:'flex',
                  alignItems:'center'
                }}>
                  <ProgressBar UNSAFE_style={{ flex:1,marginRight:16 }} value={getStepProgress()} />
                  <div style={{ width:180,textAlign:'right' }}>
                    {monitorContext.currentState?.step} / {monitorContext.currentState?.total_step} ({getStepProgress().toFixed(2)}%)
                  </div>
                </div>
              </div>

            </div>

          </Well>
          <div
            style={{
              flex: 1,
              position: 'relative'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex'
              }}
            >
              <TrainingWatchOverPanel />
            </div>


          </div>

        </div>
        <Well
          UNSAFE_style={{
            width: 320,

            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {/*{*/}
          {/*  currentOutputModel && currentOutputModel.outImage && (*/}
          {/*    <img src={`file://${currentOutputModel.outImage}`} style={{*/}
          {/*      width: 240,*/}
          {/*      height: 240,*/}
          {/*      objectFit: 'contain'*/}
          {/*    }} />*/}
          {/*  )*/}
          {/*}*/}
          <div
            style={{
              width: 240,
              height: 240,
              backgroundColor: '#2a2a2a',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Layers size={'XL'} />
          </div>

          {
            currentOutputModel && (
              <div>
                {
                  currentOutputModel.fileName
                }
              </div>
            )
          }
        </Well>
      </div>

    </>
  );
};

export default TrainingPanel;
