import styles from './index.module.css';
import { useTranslation } from 'react-i18next';
import logoImg from '../../../../../../assets/icon.png';
import Folder from '@spectrum-icons/workflow/Folder';
import ProjectAdd from '@spectrum-icons/workflow/ProjectAdd';
import FolderOpen from '@spectrum-icons/workflow/FolderOpen';
import { useAtom } from 'jotai/index';
import { trainingContextAtom } from '../../model';

export type StartPanelProps = {
  onOpenProject: () => void;
  onCreateProject: () => void;
  onOpenProjectWithPath: (path: string) => void;
}
const StartPanel = (
  {
    onCreateProject,
    onOpenProject,
    onOpenProjectWithPath
  }:StartPanelProps
) => {
  const [trainContext, setTrainContext] = useAtom(trainingContextAtom);

  const { t } = useTranslation('translation', { keyPrefix: 'panels.start' });


  return (
    <div className={styles.root}>
      <div
        style={{
          display:'flex',
          alignItems:'center',
          gap:32

        }}
      >
        <img src={logoImg} alt="logo" width={64} height={64} />
        <div className={styles.title}>
          {t('title')}
        </div>

      </div>
      <div
        style={{
          marginTop:32,
          display:'flex',
          flex:1,
          position:'relative',
        }}
      >
        <div
          style={{
            position:'absolute',
            top:0,
            bottom:0,
            left:0,
            right:0,
            display:'flex',
            gap:32,
          }}
        >
          <div
            style={{
              width:240
            }}
          >
            <div className={styles.categoryTitle}>
              { t('project') }
            </div>
            <div
              style={{
                display:'flex',
                flexDirection:'column',
                gap:16,
              }}
            >
              <div
                style={{
                  display:'flex',
                  alignItems:'center',
                  gap:8,
                  cursor:'pointer',
                }}
                onClick={onCreateProject}
              >
                <ProjectAdd />
                { t("newProject") }
              </div>
              <div
                style={{
                  display:'flex',
                  alignItems:'center',
                  gap:8,
                  cursor:'pointer',
                }}
                onClick={onOpenProject}
              >
                <FolderOpen />
                { t("openProject") }
              </div>
            </div>

          </div>
          <div style={{
            width:1,
            height:"100%",
            backgroundColor:'#262626',
          }} />
          <div style={{
            flex:60,
            display:'flex',
            flexDirection:'column',
          }}>
            <div className={styles.categoryTitle}>
              { t("recentProjects") }
            </div>
            <div style={{
              overflowY:'auto',
              display:'flex',
              flexDirection:'column',
              gap:8,
              cursor:'pointer',
            }}>
              {
                trainContext.recentProjects.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      padding:8,
                      display:'flex',
                      alignItems:'center',
                      gap:16,
                    }}
                    onClick={() => onOpenProjectWithPath(item.path)}
                  >
                    <Folder />
                    <div style={{

                    }}>
                      {item.name}
                      <div
                        style={{
                          fontSize:12,
                          color:'#999999',
                          width:'50vw'
                        }}
                      >
                        {item.path}
                      </div>
                    </div>

                  </div>
                ))
              }
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default StartPanel;
