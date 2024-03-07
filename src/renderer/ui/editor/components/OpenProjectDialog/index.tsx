import { NewProjectValues } from '../NewProjectDialog';
import {
  ActionButton, Button,
  ButtonGroup,
  Content,
  Dialog, DialogContainer,
  Divider,
  Flex,
  Heading,
  Slider,
  TextField
} from '@adobe/react-spectrum';
import { useTranslation } from 'react-i18next';
import { SavedProject } from '../../../../../types';
import { useEffect, useState } from 'react';
import { getProjectList } from '../../../../service/training/dataset';
import Project from '@spectrum-icons/workflow/Project';

export type OpenProjectDialogProps = {
  isOpen: boolean,
  onClose: () => void
  onOpen: (id: string) => void
}
const openProjectDialog = (
  {
    isOpen,
    onClose,
    onOpen
  }: OpenProjectDialogProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'dialogs.openProject' });
  const [projectList, setProjectList] = useState<SavedProject[]>([]);
  const init = async () => {
    const projects = await getProjectList()
    setProjectList(projects);
  }
  useEffect(() => {
    if (isOpen) {
      init();
    }
  },[isOpen])
  return (
    <DialogContainer onDismiss={onClose} isDismissable={true}>
      {
        isOpen &&
        (
          <Dialog>
            <Heading>{t('title')}</Heading>
            <Divider />
            <Content>
              <Flex
                direction="column"
                gap={8}
                height={'50vh'}
              >
                {
                  projectList.map((project) => {
                    return (
                      <div
                        style={{
                          padding: '8px',
                          backgroundColor: '#2a2a2a',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          onOpen(project.name);
                        }}
                      >
                        {project.name}
                      </div>
                    )
                  })
                }
              </Flex>

            </Content>
          </Dialog>
        )
      }
    </DialogContainer>
  )
};
export default openProjectDialog;
