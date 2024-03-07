import styles from './index.module.css';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { readConfig, selectFolder } from '../../service/config';
import { closeInstall, getDefaultInstallPath, installDeps, setInstallDir } from '../../service/trainer/installer';
import { ipcRenderer } from '../../service/base';
import { ChannelsKeys, InstallMessage, LoraConfig } from '../../../types';
import { openEditorWindow } from '../../service/trainer/editor';
import { checkNeedInstall } from '../../service/trainer/splash';
import { ActionButton, Button, TextField, Well } from '@adobe/react-spectrum';
import { toast } from 'react-toastify';

const InstallerPage = () => {
  const [installPath, setInstallPath] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [config, setConfig] = useState<LoraConfig>({});

  const init = async () => {
    const saveConfigData = await readConfig({ key: 'training_config' });
    if (saveConfigData) {
      setConfig(saveConfigData);
    }
    const defaultInstallPath: string = await getDefaultInstallPath();
    if (defaultInstallPath) {
      setInstallPath(defaultInstallPath);
    }
  };
  const onSelectInstallPath = async () => {
    const selectPath = await selectFolder({ title: '选择安装目录' });
    if (!selectPath) {
      return;
    }
    setInstallPath(selectPath);
    const needInstall = await checkNeedInstall({ targetPath: selectPath });
    console.log(needInstall);
    if (needInstall) {
      setIsInstalled(false);

    } else {
      setIsInstalled(true);
      setInstallDir({targetPath: selectPath})
      toast.success('已检测到安装', {
        position: "bottom-center",
        autoClose: 2000,
        closeOnClick: true,
        pauseOnHover: true,
        theme: "dark",
        hideProgressBar:true,
        closeButton:false,
      });

    }
  };
  const onCompleteHandler = async () => {
    openEditorWindow();
    closeInstall();
  };
  useEffect(() => {
    init();
  }, []);
  useEffect(() => {
    ipcRenderer.on(ChannelsKeys.installLog, (data: InstallMessage) => {
      switch (data.event) {
        case 'message':
          setLogs((logs) => [data.message, ...logs]);
          break;
        case 'start-install':
          setIsInstalling(true);
          break;
        case 'install-success':
          setIsInstalling(false);
          setIsInstalled(true);
          break;
      }
    });
    return () => {
      ipcRenderer.removeAllListeners(ChannelsKeys.installLog);
    };
  }, [logs, isInstalling]);
  const onInstallHandler = async () => {
    setLogs([]);
    installDeps({ installPath });
  };
  return (
    <div className={styles.root}>
      <Well
        UNSAFE_className={clsx(styles.flex)}
        UNSAFE_style={{
          alignItems:'flex-end',
          gap:16,
          display:'flex',
        }}
      >


        <TextField
          value={installPath}
          label={'安装路径'}
          onChange={(e) => setInstallPath(e)}
          UNSAFE_style={{
            flex:1
          }}
        />
        <ActionButton onPress={onSelectInstallPath}>
          选择路径
        </ActionButton>
      </Well>
      <div className={styles.logContainer}>
        <pre className={styles.logContent}>
          {
            logs.join('\n')
          }
        </pre>
      </div>
      {
        isInstalled ?
          <Button
            onPress={onCompleteHandler}
            variant={"accent"}
          >
            完成安装
          </Button>
          : <Button

            onPress={onInstallHandler}
            variant={"cta"}
          >
            安装
          </Button>
      }
    </div>
  );
};
export default InstallerPage;
