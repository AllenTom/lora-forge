import { Content, Dialog, Divider, Heading } from '@adobe/react-spectrum';
import React from 'react';
import { InspectorItem } from '../../hooks/ProjectInspector';
import { DatasetFolder, DatasetItem } from '../../../../../types';
import Folder from '@spectrum-icons/workflow/Folder';
import { useTranslation } from 'react-i18next';
import styles from './index.module.css';
import { getTypeColor } from '../../../../utils/color';

export type InspectorPopupProps = {
  inspectorResult: InspectorItem[];
}
const InspectorPopup = ({ inspectorResult }: InspectorPopupProps) => {
  const { t } = useTranslation();
  const [scopeFilter, setScopeFilter] = React.useState<string[]>([
    'dataset', 'config', 'other'
  ]);
  const [levelFilter, setLevelFilter] = React.useState<string[]>([
    'error', 'info', 'warning'
  ]);
  const getInspectorResult = () => {
    let items = inspectorResult;
    if (scopeFilter.length !== 0) {
      items = items.filter((item) => {
        return scopeFilter.includes(item.scope);
      });
    }
    if (levelFilter.length !== 0) {
      items = items.filter((item) => {
        return levelFilter.includes(item.type);
      });
    }
    return items;
  };

  return (
    <Dialog width={'50vw'}>
      <Heading>项目检查器</Heading>
      <Content>
        <div
          style={{
            display: 'flex'
          }}
        >
          <div style={{
            display: 'flex',
            gap: 8,
            marginTop: 16,
            marginBottom: 8,
            flex: 1
          }}>
            {
              ['dataset', 'config', 'other'].map((item) => {
                return (
                  <div
                    className={styles.filterChip}
                    style={{
                      backgroundColor: scopeFilter.includes(item) ? '#008252' : undefined
                    }}
                    onClick={() => {
                      if (scopeFilter.includes(item)) {
                        setScopeFilter(scopeFilter.filter((i) => i !== item));
                      } else {
                        setScopeFilter([...scopeFilter, item]);
                      }
                    }}
                  >
                    {t(`validate.${item}`)} ({inspectorResult.filter((i) => i.scope === item).length})
                  </div>
                );

              })
            }
          </div>
          <div className={styles.filterHeader}>
            {
              ['error', 'warning', 'info'].map((item) => {
                return (
                  <div
                    className={styles.filterChip}

                    style={{
                      backgroundColor: levelFilter.includes(item) ? '#008252' : undefined

                    }}
                    onClick={() => {
                      if (levelFilter.includes(item)) {
                        setLevelFilter(levelFilter.filter((i) => i !== item));
                      } else {
                        setLevelFilter([...levelFilter, item]);
                      }
                    }}
                  >
                    {t(`validate.${item}`)} ({inspectorResult.filter((i) => i.type === item).length})
                  </div>
                );
              })
            }
          </div>
        </div>

        <Divider />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginTop: 8,
            height: '50vh',
            overflowY: 'auto'
          }}
        >
          {
            getInspectorResult().map((item, index) => {
              switch (item.event) {
                case 'noCaption':
                  const extra = item.extra as {
                    item: DatasetItem,
                    folder: DatasetFolder
                  };
                  return (
                    <div
                      className={styles.itemContainer}
                      style={{
                        borderColor: getTypeColor(item.type),
                        boxSizing: 'border-box'
                      }}>
                      <div style={{
                        flex: 1
                      }}>
                        <div
                          style={{
                            fontSize: 16
                          }}
                        >{item.title}</div>
                        {item.message}
                      </div>
                      <div style={{
                        textAlign: 'center',
                        marginRight: 16
                      }}>
                        <Folder size={'XS'} />
                        <div style={{
                          fontSize: 16
                        }}>
                          {extra.folder.name}

                        </div>
                      </div>
                      <img
                        src={`file:///${extra.item.imagePath}`}
                        style={{
                          width: 48,
                          height: 48
                        }}
                      />
                    </div>
                  );
                default:
                  return (
                    <div
                      className={styles.itemContainerGeneral}
                      style={{
                        borderColor: getTypeColor(item.type),
                        boxSizing: 'border-box'
                      }}>
                      <Heading level={4}>{item.title}</Heading>
                      <div>
                        {item.message}
                      </div>
                    </div>
                  );
              }
            })
          }
        </div>
      </Content>
    </Dialog>
  );
};

export default InspectorPopup;
