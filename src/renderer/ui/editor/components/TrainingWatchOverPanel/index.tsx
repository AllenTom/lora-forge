import { useAtom } from 'jotai';
import { outputModelAtom, updateMonitorAtom } from '../../model';
import { Well } from '@adobe/react-spectrum';
import Layers from '@spectrum-icons/workflow/Layers';

export type TrainingWatchOverPanelProps = {}
const TrainingWatchOverPanel = (
  {}: TrainingWatchOverPanelProps
) => {
  const [_, updateMonitorData] = useAtom(updateMonitorAtom);
  const [outputModels, setOutputModels] = useAtom(outputModelAtom);
  return (
    <Well
     flex={1}
     UNSAFE_style={{
       display:'flex',
       flexDirection:'column',
     }}
    >
      <div
        style={{
          marginBottom:16,
        }}
      >Train WatchOver</div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          overflowY: 'auto',
          flex: 1,
          position:'relative'
        }}
      >
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignContent: 'flex-start',
          overflowY: 'auto',
          bottom: 0,
          left: 0,
          right: 0,
          top: 0,
          position: 'absolute'
        }}>
          {
            outputModels.map((it, index) => {
              // if (it.outImage) {
              //   return (
              //     <div
              //       style={{
              //         width: 120,
              //         marginRight: 16, marginBottom: 16
              //       }}
              //       onClick={() => updateMonitorData({ currentModelName: it.fileName })}
              //     >
              //       <img src={`file://${it.outImage}`} style={{ width: 120, height: 120 }} />
              //       <div style={{
              //         maxLines: 2,
              //         lineHeight: 1.2,
              //         textAlign: 'center',
              //         height: 40,
              //         overflow: 'hidden',
              //         textOverflow: 'ellipsis'
              //       }}>
              //         {it.name}
              //       </div>
              //     </div>
              //   );
              // }
              return (
                <div
                  style={{
                    width: 120,
                    height: 120,
                    backgroundColor: '#2a2a2a',
                    marginRight: 16,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                }}
                  onClick={() => updateMonitorData({ currentModelName: it.fileName })}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width:'100%',
                    flex:1
                  }}>
                    <Layers />
                  </div>



                </div>
              );
            })
          }
        </div>
      </div>
    </Well>
  );
};
export default TrainingWatchOverPanel;
