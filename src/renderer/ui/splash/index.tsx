import coverImg from '../../../../assets/splash.jpg';
import { checkNeedInstall, runDoctorCheck } from '../../service/trainer/splash';
import { useEffect } from 'react';
import { ipcRenderer } from '../../service/base';
import { ChannelsKeys } from '../../../types';

const SplashPage = () => {
  const atLeast = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true)
    }, 3000)
  });
  const startDoctorCheck = () => {
    runDoctorCheck()
  }
  const check = async () => {
    const needInstall = await checkNeedInstall({})
    return needInstall
  }
  const run = async () => {

    // const [needInstall]  = await Promise.all([check(),atLeast])
    // if (needInstall) {
    //   openInstall()
    //   closeSplash()
    //   return
    // }
    // openEditorWindow()
    // closeSplash()
  }
  useEffect(() => {
    run()
  }, []);
  useEffect(() => {
    ipcRenderer.on(ChannelsKeys.doctorCheckSuccess, () => {
      console.log('doctorCheckSuccess')
    })
    ipcRenderer.on(ChannelsKeys.doctorCheckFail, () => {
      console.log('doctorCheckFail')
    })
    return () => {
      ipcRenderer.removeAllListeners(ChannelsKeys.doctorCheckSuccess)
      ipcRenderer.removeAllListeners(ChannelsKeys.doctorCheckFail)
    }
  },[])
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <img src={coverImg} style={{
        width: '100vw',
        height: '100vh',
        position: 'absolute'
      }} />
      <div style={{
        width: '100vw',
        bottom: 0,
        position: 'absolute',
        color: 'white',
        padding: 16
      }}>
        <div>
          <h1 onClick={() => {
            runDoctorCheck()
          }}>App Name</h1>
          <div>Version: 1.0.0</div>
        </div>
      </div>
    </div>
  );
};

export default SplashPage;
